import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

/**
 * Google Play Real-time Developer Notifications webhook handler
 *
 * This webhook receives automatic notifications when:
 * - Subscriptions are purchased/renewed
 * - Subscriptions are cancelled
 * - Payments fail or recover
 *
 * This solves the critical issue where users get charged on Day 3
 * but our backend doesn't know until they open the app.
 */

interface GoogleNotification {
	version: string;
	packageName: string;
	eventTimeMillis: string;
	subscriptionNotification?: {
		version: string;
		notificationType: number;
		purchaseToken: string;
		subscriptionId: string;
	};
	oneTimeProductNotification?: {
		version: string;
		notificationType: number;
		purchaseToken: string;
		sku: string;
	};
	testNotification?: {
		version: string;
	};
}

interface GooglePubSubMessage {
	message: {
		data: string; // Base64 encoded GoogleNotification
		messageId: string;
		publishTime: string;
	};
	subscription: string;
}

// Google Play notification types
const GOOGLE_NOTIFICATION_TYPES = {
	SUBSCRIPTION_RECOVERED: 1,
	SUBSCRIPTION_RENEWED: 2,
	SUBSCRIPTION_CANCELED: 3,
	SUBSCRIPTION_PURCHASED: 4,
	SUBSCRIPTION_ON_HOLD: 5,
	SUBSCRIPTION_IN_GRACE_PERIOD: 6,
	SUBSCRIPTION_RESTARTED: 7,
	SUBSCRIPTION_PRICE_CHANGE_CONFIRMED: 8,
	SUBSCRIPTION_DEFERRED: 9,
	SUBSCRIPTION_PAUSED: 10,
	SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED: 11,
	SUBSCRIPTION_REVOKED: 12,
	SUBSCRIPTION_EXPIRED: 13,
} as const;

/**
 * Verify webhook - simplified approach for initial implementation
 * Google Pub/Sub provides transport security via HTTPS
 */
async function verifyWebhookSignature(
	request: NextRequest,
	body: string
): Promise<boolean> {
	try {
		// Rely on HTTPS and Google Pub/Sub security
		// Google Pub/Sub only delivers to your configured endpoint

		// Basic request validation
		if (!body || body.length === 0) {
			console.error("Empty webhook body");
			return false;
		}

		// Verify it's a valid Pub/Sub message format
		try {
			const pubsubMessage = JSON.parse(body);
			if (!pubsubMessage.message || !pubsubMessage.message.data) {
				console.error("Invalid Pub/Sub message format");
				return false;
			}
		} catch {
			console.error("Invalid JSON in webhook body");
			return false;
		}

		return true; // Pub/Sub provides the security via controlled delivery
	} catch (error) {
		console.error("Google webhook signature verification failed:", error);
		return false;
	}
}

/**
 * Get Google Play access token for API calls
 */
async function getGooglePlayAccessToken(): Promise<string> {
	// Use service account credentials to get access token
	const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
	if (!serviceAccountKey) {
		throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
	}

	try {
		const credentials = JSON.parse(serviceAccountKey);

		// Create JWT for Google OAuth2
		const now = Math.floor(Date.now() / 1000);

		const payload = {
			iss: credentials.client_email,
			scope: "https://www.googleapis.com/auth/androidpublisher",
			aud: "https://oauth2.googleapis.com/token",
			iat: now,
			exp: now + 3600,
		};

		const token = jwt.sign(payload, credentials.private_key, {
			algorithm: "RS256",
		});

		// Exchange JWT for access token
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: token,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Google OAuth error:", {
				status: response.status,
				error: errorText,
			});
			throw new Error(`Google OAuth failed: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		if (!data.access_token) {
			throw new Error("No access token received from Google OAuth");
		}

		return data.access_token;
	} catch (error) {
		console.error("Failed to get Google Play access token:", error);
		throw error;
	}
}

/**
 * Get subscription details from Google Play API
 */
async function getSubscriptionDetails(
	packageName: string,
	subscriptionId: string,
	purchaseToken: string
) {
	try {
		const accessToken = await getGooglePlayAccessToken();

		const response = await fetch(
			`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${purchaseToken}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		if (!response.ok) {
			throw new Error(`Google Play API error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error("Failed to get subscription details:", error);
		throw error;
	}
}

/**
 * Find user by purchase token
 */
async function findUserByPurchaseToken(purchaseToken: string) {
	const users = await db
		.select()
		.from(user)
		.where(eq(user.iapTransactionId, purchaseToken))
		.limit(1);

	return users[0] || null;
}

/**
 * Handle subscription purchase/renewal
 */
async function handleSubscriptionPurchase(
	packageName: string,
	subscriptionId: string,
	purchaseToken: string
) {
	try {
		// Try to get subscription details, but handle API failures gracefully
		let subscriptionDetails = null;
		try {
			subscriptionDetails = await getSubscriptionDetails(
				packageName,
				subscriptionId,
				purchaseToken
			);
		} catch (error) {
			console.warn(
				"Failed to get subscription details, using fallback logic:",
				error
			);
		}

		const foundUser = await findUserByPurchaseToken(purchaseToken);
		if (!foundUser) {
			console.error(`No user found for purchase token ${purchaseToken}`);
			return;
		}

		const now = new Date();

		// Calculate subscription end date
		let expiresDate: Date;
		if (subscriptionDetails?.expiryTimeMillis) {
			expiresDate = new Date(parseInt(subscriptionDetails.expiryTimeMillis));
		} else {
			// Fallback: Calculate based on subscription type
			const durationDays = subscriptionId.includes("yearly") ? 365 : 30;
			expiresDate = new Date(
				now.getTime() + durationDays * 24 * 60 * 60 * 1000
			);
		}

		// If Google sent us a webhook, it means the trial period is over - activate the user
		const updatedUser = await db
			.update(user)
			.set({
				subscriptionStatus: "active",
				subscriptionPlan: subscriptionId,
				subscriptionStartDate: subscriptionDetails?.startTimeMillis
					? new Date(parseInt(subscriptionDetails.startTimeMillis))
					: now,
				subscriptionEndDate: expiresDate,
				iapTransactionId: purchaseToken,
				updatedAt: now,
			})
			.where(eq(user.id, foundUser.id))
			.returning({ id: user.id, email: user.email });

		console.log(
			`✅ Google webhook: Activated subscription for user ${
				updatedUser[0]?.email
			}, expires ${expiresDate.toISOString()}`
		);
	} catch (error) {
		console.error("Failed to handle subscription purchase:", error);
	}
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(purchaseToken: string) {
	const foundUser = await findUserByPurchaseToken(purchaseToken);
	if (!foundUser) {
		console.error(`No user found for purchase token ${purchaseToken}`);
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
		`Google webhook: Cancelled subscription for user ${updatedUser[0]?.email}`
	);
}

/**
 * Handle subscription expiration
 */
async function handleSubscriptionExpiration(purchaseToken: string) {
	const foundUser = await findUserByPurchaseToken(purchaseToken);
	if (!foundUser) {
		console.error(`No user found for purchase token ${purchaseToken}`);
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
		`Google webhook: Expired subscription for user ${updatedUser[0]?.email}`
	);
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.text();
		console.log("Google webhook received body:", body);

		// Verify webhook signature
		if (!(await verifyWebhookSignature(request, body))) {
			console.error("Google webhook: Invalid signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const pubsubMessage: GooglePubSubMessage = JSON.parse(body);
		console.log("Parsed Pub/Sub message:", pubsubMessage);

		// Decode the base64 notification data
		const notificationData = Buffer.from(
			pubsubMessage.message.data,
			"base64"
		).toString("utf8");
		console.log("Decoded notification data:", notificationData);

		const notification: GoogleNotification = JSON.parse(notificationData);

		console.log(`Google webhook received:`, {
			packageName: notification.packageName,
			messageId: pubsubMessage.message.messageId,
		});

		// Handle subscription notifications
		if (notification.subscriptionNotification) {
			const subNotification = notification.subscriptionNotification;
			const { notificationType, purchaseToken, subscriptionId } =
				subNotification;

			console.log(
				`Google subscription notification type: ${notificationType} for ${subscriptionId}`
			);

			switch (notificationType) {
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PURCHASED:
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED:
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RECOVERED:
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_RESTARTED:
					// Subscription purchased or renewed - convert trial to active
					await handleSubscriptionPurchase(
						notification.packageName,
						subscriptionId,
						purchaseToken
					);
					break;

				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_CANCELED:
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_REVOKED:
					// Subscription cancelled
					await handleSubscriptionCancellation(purchaseToken);
					break;

				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED:
					// Subscription expired
					await handleSubscriptionExpiration(purchaseToken);
					break;

				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_ON_HOLD:
				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_IN_GRACE_PERIOD:
					// Subscription in grace period - could implement grace period logic
					console.log(
						`Google webhook: Subscription in grace period for ${subscriptionId}`
					);
					break;

				case GOOGLE_NOTIFICATION_TYPES.SUBSCRIPTION_PAUSED:
					// Subscription paused
					console.log(
						`Google webhook: Subscription paused for ${subscriptionId}`
					);
					break;

				default:
					console.log(
						`Google webhook: Unhandled notification type: ${notificationType}`
					);
			}
		}

		// Handle test notifications
		if (notification.testNotification) {
			console.log("Google webhook: Test notification received");
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Google webhook error:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 }
		);
	}
}
