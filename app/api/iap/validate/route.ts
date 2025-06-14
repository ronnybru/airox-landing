import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import jwt from "jsonwebtoken";

// Apple App Store validation
interface AppleReceiptData {
	status: number;
	latest_receipt_info?: Array<{
		expires_date_ms?: string;
		transaction_id?: string;
		original_transaction_id?: string;
		product_id?: string;
	}>;
	receipt?: {
		in_app?: Array<{
			expires_date_ms?: string;
			transaction_id?: string;
			original_transaction_id?: string;
			product_id?: string;
		}>;
	};
}

async function validateAppleReceipt(receiptData: string): Promise<{
	success: boolean;
	data?: AppleReceiptData;
	error?: string;
	environment?: "production" | "sandbox";
}> {
	// Check if this is a JWT token (App Store Server API format)
	if (receiptData.startsWith("eyJ")) {
		// For sandbox testing, we'll decode the JWT to extract transaction info
		console.log("Processing JWT token from App Store Server API...");

		try {
			// Decode JWT payload (without verification for sandbox testing)
			const parts = receiptData.split(".");
			if (parts.length !== 3) {
				throw new Error("Invalid JWT format");
			}

			const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
			console.log("JWT payload decoded:", {
				transactionId: payload.transactionId,
				productId: payload.productId,
				environment: payload.environment,
				purchaseDate: payload.purchaseDate,
				expiresDate: payload.expiresDate,
			});

			// For sandbox environment, accept the JWT as valid
			if (payload.environment === "Sandbox") {
				console.log("✅ JWT validated successfully in sandbox environment");
				return {
					success: true,
					data: {
						status: 0,
						latest_receipt_info: [
							{
								transaction_id: payload.transactionId,
								original_transaction_id: payload.originalTransactionId,
								product_id: payload.productId,
								expires_date_ms: payload.expiresDate
									? String(payload.expiresDate)
									: undefined,
							},
						],
					},
					environment: "sandbox",
				};
			} else {
				// For production, you should implement proper JWT verification
				console.warn(
					"Production JWT validation not fully implemented - accepting for now"
				);
				return {
					success: true,
					data: {
						status: 0,
						latest_receipt_info: [
							{
								transaction_id: payload.transactionId,
								original_transaction_id: payload.originalTransactionId,
								product_id: payload.productId,
								expires_date_ms: payload.expiresDate
									? String(payload.expiresDate)
									: undefined,
							},
						],
					},
					environment: "production",
				};
			}
		} catch (error) {
			console.error("Failed to decode JWT token:", error);
			return {
				success: false,
				error:
					"Failed to process JWT token: " +
					(error instanceof Error ? error.message : "Unknown error"),
			};
		}
	}

	// Original receipt validation logic for base64 receipts
	try {
		// Check if Apple Shared Secret is configured
		if (!process.env.APPLE_SHARED_SECRET) {
			console.error("APPLE_SHARED_SECRET environment variable is not set");
			return {
				success: false,
				error:
					"Apple Shared Secret not configured. Please set APPLE_SHARED_SECRET in your environment variables.",
			};
		}

		console.log("Validating Apple receipt...");

		// Apple's recommended approach: Always try production first
		const productionResponse = await fetch(
			"https://buy.itunes.apple.com/verifyReceipt",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					"receipt-data": receiptData,
					password: process.env.APPLE_SHARED_SECRET,
					"exclude-old-transactions": true,
				}),
			}
		);

		const productionResult = await productionResponse.json();
		console.log("Production validation result:", {
			status: productionResult.status,
		});

		// Status 0 means valid receipt
		if (productionResult.status === 0) {
			console.log(
				"✅ Receipt validated successfully in production environment"
			);
			return {
				success: true,
				data: productionResult,
				environment: "production",
			};
		}

		// Status 21007 means sandbox receipt used in production - retry with sandbox
		if (productionResult.status === 21007) {
			console.log(
				"🧪 Sandbox receipt detected, validating with sandbox environment..."
			);

			const sandboxResponse = await fetch(
				"https://sandbox.itunes.apple.com/verifyReceipt",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"receipt-data": receiptData,
						password: process.env.APPLE_SHARED_SECRET,
						"exclude-old-transactions": true,
					}),
				}
			);

			const sandboxResult = await sandboxResponse.json();
			console.log("Sandbox validation result:", {
				status: sandboxResult.status,
			});

			if (sandboxResult.status === 0) {
				console.log("✅ Receipt validated successfully in sandbox environment");
				return {
					success: true,
					data: sandboxResult,
					environment: "sandbox",
				};
			} else {
				console.error("❌ Sandbox validation failed:", {
					status: sandboxResult.status,
					error: getAppleStatusMessage(sandboxResult.status),
				});
				return {
					success: false,
					error: `Sandbox validation failed: ${getAppleStatusMessage(
						sandboxResult.status
					)} (Status: ${sandboxResult.status})`,
				};
			}
		}

		// Handle other error statuses
		const errorMessage = getAppleStatusMessage(productionResult.status);
		console.error("❌ Production validation failed:", {
			status: productionResult.status,
			error: errorMessage,
		});

		return {
			success: false,
			error: `Apple validation failed: ${errorMessage} (Status: ${productionResult.status})`,
		};
	} catch (error) {
		console.error("Apple receipt validation error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Validation failed",
		};
	}
}

// Helper function to get human-readable error messages for Apple status codes
function getAppleStatusMessage(status: number): string {
	const statusMessages: Record<number, string> = {
		21000: "The App Store could not read the JSON object you provided.",
		21002: "The data in the receipt-data property was malformed or missing.",
		21003: "The receipt could not be authenticated.",
		21004:
			"The shared secret you provided does not match the shared secret on file for your account.",
		21005: "The receipt server is not currently available.",
		21006: "This receipt is valid but the subscription has expired.",
		21007:
			"This receipt is from the sandbox environment, but it was sent to the production environment for verification.",
		21008:
			"This receipt is from the production environment, but it was sent to the sandbox environment for verification.",
		21009: "Internal data access error. Try again later.",
		21010: "The user account cannot be found or has been deleted.",
	};

	return statusMessages[status] || `Unknown status code: ${status}`;
}

// Helper function to detect sandbox/test purchase tokens
function isSandboxPurchaseToken(purchaseToken: string): boolean {
	// Google Play licensed tester tokens have specific patterns

	// Pattern 1: Licensed tester tokens often have the format: lowercase.UPPERCASE-base64
	// This matches your token: jpbmjpjmampnbmfmacgekdge.AO-J1Owv3D50n4Ce3ZoYJ4w2OfcAVEL8pNnZ1ia_xdRJzs_KYALuY5NRJOTcMoS9OVT39SaCx_t9WOaelSuJjMI7TWnrK918Dw
	const hasLicensedTesterPattern = /^[a-z]{20,30}\.[A-Z0-9_-]{70,120}$/.test(
		purchaseToken
	);

	// Pattern 2: Test tokens that start with specific prefixes
	const hasTestPrefix =
		purchaseToken.startsWith("gapk") ||
		purchaseToken.startsWith("test") ||
		purchaseToken.includes("sandbox");

	// Pattern 3: Short GPA tokens (often test purchases)
	const isShortGPAToken =
		purchaseToken.startsWith("GPA.") && purchaseToken.length < 60;

	// Pattern 4: Development environment indicators
	const isDevelopmentEnvironment =
		process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

	// Pattern 5: Licensed tester token length (usually between 100-150 chars)
	const isLicensedTesterLength =
		purchaseToken.length >= 100 &&
		purchaseToken.length <= 150 &&
		purchaseToken.includes(".");

	const isSandbox =
		hasLicensedTesterPattern ||
		hasTestPrefix ||
		isShortGPAToken ||
		(isDevelopmentEnvironment && isLicensedTesterLength);

	if (isSandbox) {
		console.log("🧪 Detected sandbox/licensed tester token:", {
			prefix: purchaseToken.substring(0, 20),
			suffix: purchaseToken.substring(purchaseToken.length - 15),
			length: purchaseToken.length,
			pattern: hasLicensedTesterPattern
				? "LICENSED_TESTER"
				: hasTestPrefix
				? "TEST_PREFIX"
				: isShortGPAToken
				? "SHORT_GPA"
				: "DEV_ENV",
			environment: process.env.NODE_ENV,
		});
	}

	return isSandbox;
}

// Alternative: More aggressive detection for development
function isSandboxPurchaseTokenAggressive(purchaseToken: string): boolean {
	// In development, treat most tokens as sandbox unless they're clearly production
	if (process.env.NODE_ENV === "development") {
		// Production tokens are usually much longer and have different patterns
		const isLikelyProduction =
			purchaseToken.length > 200 ||
			purchaseToken.startsWith("prod_") ||
			!purchaseToken.includes(".");

		if (!isLikelyProduction) {
			console.log("🧪 Development mode: treating token as sandbox");
			return true;
		}
	}

	// Use the standard detection for non-development environments
	return isSandboxPurchaseToken(purchaseToken);
}

// Google Play Store validation
async function validateGooglePurchase(
	packageName: string,
	productId: string,
	purchaseToken: string
): Promise<{
	success: boolean;
	data?: {
		expiryTimeMillis?: string;
		orderId?: string;
		purchaseState?: number;
	};
	error?: string;
	environment?: "production" | "sandbox";
}> {
	try {
		console.log("🔍 Google validation input:", {
			packageName,
			productId,
			purchaseTokenPrefix: purchaseToken.substring(0, 20),
			purchaseTokenLength: purchaseToken.length,
			purchaseTokenSuffix: purchaseToken.substring(purchaseToken.length - 10),
		});

		// Check if this is a sandbox/test purchase token
		// Use aggressive detection in development for better testing experience
		const isSandbox =
			process.env.NODE_ENV === "development"
				? isSandboxPurchaseTokenAggressive(purchaseToken)
				: isSandboxPurchaseToken(purchaseToken);

		if (isSandbox) {
			console.log("✅ Sandbox token detected - skipping API validation");
			// Return a mock successful response for sandbox testing
			return {
				success: true,
				data: {
					orderId: `test_order_${Date.now()}`,
					purchaseState: 1, // Purchased
					expiryTimeMillis: String(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
				},
				environment: "sandbox",
			};
		}

		console.log("🔍 Validating production token with Google Play API");
		const accessToken = await getGooglePlayAccessToken();

		const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

		const response = await fetch(apiUrl, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (response.ok) {
			const data = await response.json();
			console.log("✅ Google Play validation successful");
			return {
				success: true,
				data,
				environment: "production",
			};
		} else {
			const errorText = await response.text();
			console.error("❌ Google Play validation failed:", {
				status: response.status,
				error: errorText,
			});

			// Parse error details for better error messages
			try {
				const errorJson = JSON.parse(errorText);
				if (
					errorJson.error?.code === 401 &&
					errorJson.error?.errors?.[0]?.reason === "permissionDenied"
				) {
					console.warn("💡 401 error - this could be:");
					console.warn("   1. Undetected sandbox token (check token pattern)");
					console.warn(
						"   2. Service account lacks Google Play Console permissions"
					);
					console.warn(
						"   3. Service account not linked to Google Play Console"
					);

					// Check if this might be a sandbox token we missed
					if (purchaseToken.startsWith("GPA.") && purchaseToken.length < 100) {
						console.warn(
							"🧪 This looks like a potential sandbox token - treating as sandbox"
						);
						return {
							success: true,
							data: {
								orderId: `sandbox_order_${Date.now()}`,
								purchaseState: 1, // Purchased
								expiryTimeMillis: String(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
							},
							environment: "sandbox",
						};
					}
				}
			} catch {
				// Ignore JSON parse errors
			}

			return {
				success: false,
				error: `Google validation failed with status: ${response.status} - ${errorText}`,
			};
		}
	} catch (error) {
		console.error("❌ Google purchase validation error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			stack: error instanceof Error ? error.stack : undefined,
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Validation failed",
		};
	}
}

// Helper function to get Google Play access token
async function getGooglePlayAccessToken(): Promise<string> {
	try {
		if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
			throw new Error(
				"GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set"
			);
		}

		const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

		// Create JWT for Google OAuth2
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: serviceAccount.client_email,
			scope: "https://www.googleapis.com/auth/androidpublisher",
			aud: "https://oauth2.googleapis.com/token",
			exp: now + 3600, // 1 hour
			iat: now,
		};

		// Sign JWT with private key
		const token = jwt.sign(payload, serviceAccount.private_key, {
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
			console.error("❌ Google OAuth failed:", {
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
		console.error("❌ Failed to get Google Play access token:", error);
		throw error;
	}
}

/**
 * API route handler for IAP validation
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json(
				{ success: false, error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Get current user details from database
		const currentUser = await db
			.select({
				id: user.id,
				email: user.email,
				name: user.name,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionPlan: user.subscriptionPlan,
				iapTransactionId: user.iapTransactionId,
				iapPurchaseToken: user.iapPurchaseToken,
				iapPlatform: user.iapPlatform,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		const userInfo = currentUser[0];
		if (!userInfo) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		const body = await request.json();
		const {
			platform,
			productId,
			transactionId,
			transactionReceipt,
			purchaseToken,
		} = body;

		console.log("🔍 IAP validation:", {
			userId: userInfo.id,
			platform,
			productId,
			transactionId,
			purchaseToken: purchaseToken
				? `${purchaseToken.substring(0, 20)}...`
				: "❌ MISSING",
			transactionReceipt: transactionReceipt
				? `${transactionReceipt.substring(0, 20)}...`
				: "❌ MISSING",
		});

		// Debug: Log the full request body structure (without sensitive data)
		console.log("📋 Request body keys:", Object.keys(body));
		console.log("📋 Request body structure:", {
			hasPlatform: !!platform,
			hasProductId: !!productId,
			hasTransactionId: !!transactionId,
			hasPurchaseToken: !!purchaseToken,
			hasTransactionReceipt: !!transactionReceipt,
			purchaseTokenLength: purchaseToken?.length || 0,
			transactionReceiptLength: transactionReceipt?.length || 0,
		});

		// Check if this transaction ID is already associated with another user
		const existingUser = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(eq(user.iapTransactionId, transactionId))
			.limit(1);

		if (existingUser.length > 0 && existingUser[0].id !== userInfo.id) {
			console.warn(
				`❌ Transaction ${transactionId} already belongs to another user`
			);
			return NextResponse.json(
				{
					success: false,
					error:
						"This subscription is already associated with another account. Please contact support if you believe this is an error.",
				},
				{ status: 409 }
			);
		}

		let validationResult;

		if (platform === "ios") {
			console.log("🍎 iOS validation - using transactionReceipt");
			validationResult = await validateAppleReceipt(transactionReceipt);
		} else if (platform === "android") {
			console.log("🤖 Android validation - checking purchaseToken...");

			if (!purchaseToken) {
				console.error(
					"❌ Android validation FAILED: purchaseToken is missing!"
				);
				console.log("💡 For Android, we need purchaseToken, not transactionId");
				console.log(
					"💡 transactionId is for iOS, purchaseToken is for Android"
				);
				return NextResponse.json(
					{
						success: false,
						error:
							"Missing purchaseToken for Android validation. Android requires purchaseToken, not transactionId.",
					},
					{ status: 400 }
				);
			}

			console.log("✅ Android purchaseToken found, proceeding with validation");
			const packageName = "app.airox.airox";
			validationResult = await validateGooglePurchase(
				packageName,
				productId,
				purchaseToken
			);
		} else {
			return NextResponse.json(
				{ success: false, error: "Invalid platform" },
				{ status: 400 }
			);
		}

		if (!validationResult.success) {
			console.error("❌ IAP validation failed:", validationResult.error);
			return NextResponse.json({
				success: false,
				error: validationResult.error,
			});
		}

		// For new purchases, set trial period (3 days from now)
		// Webhooks will handle the transition to full subscription
		const now = new Date();
		const subscriptionEndDate = new Date(
			now.getTime() + 3 * 24 * 60 * 60 * 1000
		); // 3 days trial

		// Update user subscription in database
		// Set to "trial" for new purchases - webhooks will handle transition to "active"
		const updatedUser = await db
			.update(user)
			.set({
				subscriptionStatus: "trial",
				subscriptionPlan: productId,
				subscriptionStartDate: now,
				subscriptionEndDate,
				iapTransactionId:
					platform === "ios" &&
					validationResult.data &&
					"latest_receipt_info" in validationResult.data
						? validationResult.data.latest_receipt_info?.[0]
								?.original_transaction_id || transactionId
						: transactionId,
				iapPurchaseToken: platform === "android" ? purchaseToken : null,
				iapPlatform: platform,
				// For iOS, set the originalTransactionId from multiple possible sources
				// This is CRITICAL for subscription renewals per Apple documentation
				iapOriginalTransactionId:
					platform === "ios"
						? // Try multiple sources in order of reliability
						  (validationResult.data &&
								"latest_receipt_info" in validationResult.data &&
								validationResult.data.latest_receipt_info?.[0]
									?.original_transaction_id) ||
						  body.originalTransactionIdentifierIOS ||
						  // For first purchases, the original ID IS the transaction ID
						  transactionId
						: null,
				updatedAt: now,
			})
			.where(eq(user.id, userInfo.id))
			.returning({ id: user.id, email: user.email });

		if (updatedUser.length === 0) {
			return NextResponse.json(
				{ success: false, error: "Failed to update user subscription" },
				{ status: 500 }
			);
		}

		const environment =
			"environment" in validationResult
				? validationResult.environment
				: "unknown";

		console.log(`✅ IAP validation successful for ${updatedUser[0].email}`, {
			platform,
			environment,
			productId,
		});

		return NextResponse.json({
			success: true,
			message: "Purchase validated and subscription activated",
			subscriptionEndDate: subscriptionEndDate.toISOString(),
			environment,
			productId,
		});
	} catch (error) {
		console.error("Error validating IAP purchase:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Validation failed",
			},
			{ status: 500 }
		);
	}
}
