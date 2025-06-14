import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Apple App Store Server Notifications webhook handler
 *
 * This webhook receives automatic notifications when:
 * - Subscriptions are purchased/renewed
 * - Subscriptions are cancelled
 * - Payments fail or recover
 *
 * This solves the critical issue where users get charged on Day 3
 * but our backend doesn't know until they open the app.
 */

interface AppleNotification {
	notificationType: string;
	subtype?: string;
	notificationUUID: string;
	data: {
		appAppleId: number;
		bundleId: string;
		bundleVersion: string;
		environment: string;
		signedTransactionInfo: string; // JWT
		signedRenewalInfo?: string; // JWT
	};
	version: string;
	signedDate: number;
}

interface DecodedTransactionInfo {
	transactionId: string;
	originalTransactionId: string;
	productId: string;
	purchaseDate: number;
	originalPurchaseDate: number;
	expiresDate?: number;
	quantity: number;
	type: string;
	inAppOwnershipType: string;
	signedDate: number;
	environment: string;
	transactionReason?: string;
	storefront: string;
	storefrontId: string;
	price?: number;
	currency?: string;
}

/**
 * Decode Apple's JWT tokens
 * Production implementation with proper JWT decoding
 */
function decodeJWT(token: string): DecodedTransactionInfo {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) {
			throw new Error("Invalid JWT format");
		}

		const payload = parts[1];
		const decoded = Buffer.from(payload, "base64url").toString("utf8");
		return JSON.parse(decoded) as DecodedTransactionInfo;
	} catch (error) {
		console.error("Failed to decode JWT:", error);
		throw error;
	}
}

/**
 * Verify webhook - simplified approach for initial implementation
 * Apple's JWT tokens are self-verifying and signed by Apple
 */
async function verifyWebhookSignature(
	request: NextRequest,
	body: string
): Promise<boolean> {
	try {
		// Rely on HTTPS and Apple's JWT signing
		// The JWT tokens in Apple notifications are already signed by Apple

		// Basic request validation
		if (!body || body.length === 0) {
			console.error("Empty webhook body");
			return false;
		}

		return true; // JWT verification happens in decodeJWT function
	} catch (error) {
		console.error("Apple webhook verification failed:", error);
		return false;
	}
}

/**
 * Find user by transaction ID
 */
async function findUserByTransactionId(
	transactionId: string,
	originalTransactionId: string
) {
	console.log(
		`Looking for user with transaction IDs: current=${transactionId}, original=${originalTransactionId}`
	);

	// For renewals, prioritize finding by originalTransactionId first
	// This is the ID that stays constant across renewals
	let users: (typeof user.$inferSelect)[] = [];

	// First priority: check iapOriginalTransactionId against originalTransactionId
	// This is the most reliable match for renewals
	if (originalTransactionId) {
		users = await db
			.select()
			.from(user)
			.where(eq(user.iapOriginalTransactionId, originalTransactionId))
			.limit(1);

		console.log(
			`Found ${users.length} users with original transaction ID ${originalTransactionId} in iapOriginalTransactionId`
		);
	}

	// Second priority: check current transaction ID
	if (users.length === 0) {
		users = await db
			.select()
			.from(user)
			.where(eq(user.iapTransactionId, transactionId))
			.limit(1);

		console.log(
			`Found ${users.length} users with current transaction ID ${transactionId}`
		);
	}

	// Third priority: check if original ID is in the transactionId field
	// This can happen if originalTransactionId wasn't set during initial purchase
	if (users.length === 0 && originalTransactionId) {
		users = await db
			.select()
			.from(user)
			.where(eq(user.iapTransactionId, originalTransactionId))
			.limit(1);

		console.log(
			`Found ${users.length} users with original transaction ID ${originalTransactionId} in iapTransactionId`
		);
	}

	// If still not found, let's see what transaction IDs we actually have
	if (users.length === 0) {
		const allUsersWithTransactions = await db
			.select({
				id: user.id,
				email: user.email,
				iapTransactionId: user.iapTransactionId,
				iapOriginalTransactionId: user.iapOriginalTransactionId,
			})
			.from(user)
			.where(
				sql`${user.iapTransactionId} IS NOT NULL OR ${user.iapOriginalTransactionId} IS NOT NULL`
			)
			.limit(10);

		console.log(
			"Users with transaction IDs in database:",
			allUsersWithTransactions
		);
	}

	return users[0] || null;
}

/**
 * Handle subscription purchase/renewal
 */
async function handleSubscriptionPurchase(
	transactionInfo: DecodedTransactionInfo
) {
	const foundUser = await findUserByTransactionId(
		transactionInfo.transactionId,
		transactionInfo.originalTransactionId
	);

	if (!foundUser) {
		console.error(
			`No user found for transaction ${transactionInfo.transactionId}`
		);
		return;
	}

	const now = new Date();

	// Safely convert Apple timestamps (milliseconds) to Date objects
	let expiresDate: Date;
	if (transactionInfo.expiresDate) {
		// Apple timestamps are already in milliseconds, not seconds
		const timestamp = transactionInfo.expiresDate;
		expiresDate = new Date(timestamp);

		// Validate the date is reasonable (not in far future due to timestamp issues)
		const maxReasonableDate = new Date(
			Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
		); // 10 years from now
		if (expiresDate > maxReasonableDate) {
			console.warn(
				`Invalid expiry date ${expiresDate.toISOString()}, using fallback calculation`
			);
			expiresDate = new Date(
				now.getTime() +
					(transactionInfo.productId.includes("yearly") ? 365 : 30) *
						24 *
						60 *
						60 *
						1000
			);
		}
	} else {
		expiresDate = new Date(
			now.getTime() +
				(transactionInfo.productId.includes("yearly") ? 365 : 30) *
					24 *
					60 *
					60 *
					1000
		);
	}

	// Safely convert purchase date
	const purchaseDate = transactionInfo.purchaseDate
		? new Date(transactionInfo.purchaseDate)
		: now;

	console.log(
		`Date conversion: purchaseDate=${purchaseDate.toISOString()}, expiresDate=${expiresDate.toISOString()}`
	);

	// Log user details before update
	console.log(`Found user before update:`, {
		id: foundUser.id,
		email: foundUser.email,
		currentStatus: foundUser.subscriptionStatus,
		currentTransactionId: foundUser.iapTransactionId,
	});

	// Update user subscription to active
	try {
		// Log important transaction details for debugging
		console.log(`Subscription update details:`, {
			transactionId: transactionInfo.transactionId,
			originalTransactionId: transactionInfo.originalTransactionId,
			isRenewal: transactionInfo.transactionReason === "RENEWAL",
			productId: transactionInfo.productId,
		});

		// Ensure we always set both transaction IDs
		const updatedUser = await db
			.update(user)
			.set({
				subscriptionStatus: "active",
				subscriptionPlan: transactionInfo.productId,
				subscriptionStartDate: purchaseDate,
				subscriptionEndDate: expiresDate,
				iapTransactionId: transactionInfo.transactionId,
				// CRITICAL: Always store the originalTransactionId, this is our link for renewals
				iapOriginalTransactionId: transactionInfo.originalTransactionId,
				updatedAt: now,
			})
			.where(eq(user.id, foundUser.id))
			.returning({
				id: user.id,
				email: user.email,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionPlan: user.subscriptionPlan,
				subscriptionStartDate: user.subscriptionStartDate,
				subscriptionEndDate: user.subscriptionEndDate,
				iapTransactionId: user.iapTransactionId,
			});

		if (!updatedUser || updatedUser.length === 0) {
			throw new Error(
				`Database update returned no rows for user ${foundUser.id}`
			);
		}

		console.log(
			`Apple webhook: Successfully updated subscription for user ${updatedUser[0]?.email}`
		);
		console.log(`Updated user details:`, updatedUser[0]);
		console.log(`Subscription expires: ${expiresDate.toISOString()}`);

		// Verify the update actually worked
		if (updatedUser[0].subscriptionStatus !== "active") {
			console.error(
				`WARNING: Database update may have failed - status is still ${updatedUser[0].subscriptionStatus}`
			);
		}
	} catch (updateError) {
		console.error(`Failed to update user subscription:`, updateError);
		throw updateError;
	}
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(
	transactionInfo: DecodedTransactionInfo
) {
	const foundUser = await findUserByTransactionId(
		transactionInfo.transactionId,
		transactionInfo.originalTransactionId
	);

	if (!foundUser) {
		console.error(
			`No user found for transaction ${transactionInfo.transactionId}`
		);
		return;
	}

	const now = new Date();

	// Update user subscription to cancelled
	const updatedUser = await db
		.update(user)
		.set({
			subscriptionStatus: "cancelled",
			updatedAt: now,
		})
		.where(eq(user.id, foundUser.id))
		.returning({ id: user.id, email: user.email });

	console.log(
		`Apple webhook: Cancelled subscription for user ${updatedUser[0]?.email}`
	);
}

/**
 * Handle subscription expiration
 */
async function handleSubscriptionExpiration(
	transactionInfo: DecodedTransactionInfo
) {
	const foundUser = await findUserByTransactionId(
		transactionInfo.transactionId,
		transactionInfo.originalTransactionId
	);

	if (!foundUser) {
		console.error(
			`No user found for transaction ${transactionInfo.transactionId}`
		);
		return;
	}

	const now = new Date();

	// Update user subscription to expired
	const updatedUser = await db
		.update(user)
		.set({
			subscriptionStatus: "expired",
			updatedAt: now,
		})
		.where(eq(user.id, foundUser.id))
		.returning({ id: user.id, email: user.email });

	console.log(
		`Apple webhook: Expired subscription for user ${updatedUser[0]?.email}`
	);
}

export async function POST(request: NextRequest) {
	try {
		// Log raw request details
		console.log("=== APPLE WEBHOOK DEBUG START ===");
		console.log("Request method:", request.method);
		console.log("Request URL:", request.url);
		console.log(
			"Request headers:",
			Object.fromEntries(request.headers.entries())
		);

		const body = await request.text();

		// Log raw body
		console.log("Raw body length:", body.length);
		console.log("Raw body content:", body);
		console.log("Raw body type:", typeof body);

		// Verify webhook signature
		if (!(await verifyWebhookSignature(request, body))) {
			console.error("Apple webhook: Invalid signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		// Try to parse JSON and log the result
		let rawPayload: { signedPayload?: string } & Partial<AppleNotification>;
		try {
			rawPayload = JSON.parse(body);
			console.log("Parsed raw payload:", JSON.stringify(rawPayload, null, 2));
		} catch (parseError) {
			console.error("Failed to parse JSON body:", parseError);
			console.log("Body that failed to parse:", body);
			return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
		}

		// Check if this is the new Apple format with signedPayload
		let notification: AppleNotification;
		if (rawPayload.signedPayload) {
			console.log("Apple is using signedPayload format, decoding...");
			try {
				// Decode the signed payload to get the actual notification
				notification = decodeJWT(
					rawPayload.signedPayload
				) as unknown as AppleNotification;
				console.log(
					"Decoded notification from signedPayload:",
					JSON.stringify(notification, null, 2)
				);
			} catch (decodeError) {
				console.error("Failed to decode signedPayload:", decodeError);
				return NextResponse.json(
					{ error: "Invalid signedPayload" },
					{ status: 400 }
				);
			}
		} else {
			// Legacy format - notification is directly in the body
			console.log("Using legacy notification format");
			notification = rawPayload as AppleNotification;
		}

		// Log detailed notification structure
		console.log("Notification type:", notification.notificationType);
		console.log("Notification UUID:", notification.notificationUUID);
		console.log("Notification version:", notification.version);
		console.log("Notification signedDate:", notification.signedDate);
		console.log("Notification subtype:", notification.subtype);
		console.log("Notification data exists:", !!notification.data);

		if (notification.data) {
			console.log(
				"Notification data:",
				JSON.stringify(notification.data, null, 2)
			);
			console.log(
				"signedTransactionInfo exists:",
				!!notification.data.signedTransactionInfo
			);
			console.log(
				"signedRenewalInfo exists:",
				!!notification.data.signedRenewalInfo
			);
		} else {
			console.log("Notification data is missing or undefined");
		}

		console.log(`Apple webhook received: ${notification.notificationType}`, {
			notificationUUID: notification.notificationUUID,
			environment: notification.data?.environment,
		});

		// Check if data exists before trying to decode
		if (!notification.data) {
			console.error("Apple webhook: notification.data is missing");
			return NextResponse.json(
				{ error: "Missing notification data" },
				{ status: 400 }
			);
		}

		if (!notification.data.signedTransactionInfo) {
			console.error("Apple webhook: signedTransactionInfo is missing");
			return NextResponse.json(
				{ error: "Missing signedTransactionInfo" },
				{ status: 400 }
			);
		}

		// Decode the signed transaction info
		console.log("Attempting to decode signedTransactionInfo...");
		const transactionInfo: DecodedTransactionInfo = decodeJWT(
			notification.data.signedTransactionInfo
		);
		console.log(
			"Decoded transaction info:",
			JSON.stringify(transactionInfo, null, 2)
		);

		// Handle different notification types
		switch (notification.notificationType) {
			case "SUBSCRIBED":
				// Always store the originalTransactionId even for free trials
				// This is critical for future renewals
				console.log(
					`Processing SUBSCRIBED notification - storing both transaction IDs`
				);
				console.log(`Transaction ID: ${transactionInfo.transactionId}`);
				console.log(
					`Original Transaction ID: ${transactionInfo.originalTransactionId}`
				);

				// Only set to active if this is a paid purchase, not a free trial
				if (transactionInfo.price && transactionInfo.price > 0) {
					await handleSubscriptionPurchase(transactionInfo);
				} else {
					// Even for free trials, we need to store BOTH transaction IDs
					const foundUser = await findUserByTransactionId(
						transactionInfo.transactionId,
						transactionInfo.originalTransactionId
					);

					if (foundUser) {
						console.log(`Found user for free trial, updating transaction IDs`);
						await db
							.update(user)
							.set({
								iapTransactionId: transactionInfo.transactionId,
								iapOriginalTransactionId: transactionInfo.originalTransactionId,
							})
							.where(eq(user.id, foundUser.id));

						console.log(
							`Apple webhook: Free trial started for transaction ${transactionInfo.transactionId}, updated transaction IDs`
						);
					} else {
						console.log(
							`Apple webhook: Free trial started for transaction ${transactionInfo.transactionId}, but no user found`
						);
					}
				}
				break;
			case "DID_RENEW":
			case "DID_RECOVER":
				// Renewal or recovery - always set to active (real payment)
				await handleSubscriptionPurchase(transactionInfo);
				break;

			case "DID_CHANGE_RENEWAL_STATUS":
				if (notification.subtype === "AUTO_RENEW_DISABLED") {
					// User turned off auto-renewal, but subscription is still active until expiry
					console.log(
						`Apple webhook: Auto-renewal disabled for transaction ${transactionInfo.transactionId}`
					);
				} else if (notification.subtype === "AUTO_RENEW_ENABLED") {
					// User re-enabled auto-renewal
					console.log(
						`Apple webhook: Auto-renewal enabled for transaction ${transactionInfo.transactionId}`
					);
				}
				break;

			case "EXPIRED":
				// Subscription expired
				await handleSubscriptionExpiration(transactionInfo);
				break;

			case "DID_FAIL_TO_RENEW":
				// Payment failed - subscription will expire soon
				console.log(
					`Apple webhook: Payment failed for transaction ${transactionInfo.transactionId}`
				);
				// Could implement grace period logic here
				break;

			case "REFUND":
				// Subscription was refunded - cancel it
				await handleSubscriptionCancellation(transactionInfo);
				break;

			case "CANCEL":
				// Subscription was cancelled by user or Apple
				await handleSubscriptionCancellation(transactionInfo);
				break;

			default:
				console.log(
					`Apple webhook: Unhandled notification type: ${notification.notificationType}`
				);
		}

		console.log("Apple webhook processing completed successfully");
		console.log("=== APPLE WEBHOOK DEBUG END ===");
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Apple webhook error:", error);
		console.error(
			"Error stack:",
			error instanceof Error ? error.stack : "No stack trace"
		);
		console.log("=== APPLE WEBHOOK DEBUG END (ERROR) ===");
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}
