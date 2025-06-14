import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { db } from "@/lib/db";
import {
	pushTokens,
	pushCampaigns,
	pushReceipts,
	user,
	session,
} from "@/lib/db/schema";
import { eq, and, inArray, gt } from "drizzle-orm";
import { nanoid } from "nanoid";

// Initialize Expo SDK
const expo = new Expo({
	accessToken: process.env.EXPO_ACCESS_TOKEN,
	useFcmV1: true,
});

export interface PushNotificationData {
	title: string;
	message: string;
	// Multi-language support
	titleEn?: string;
	messageEn?: string;
	titleNo?: string;
	messageNo?: string;
	titleEs?: string;
	messageEs?: string;
	titleDe?: string;
	messageDe?: string;
	data?: Record<string, unknown>;
	sound?: string;
	badge?: number;
}

export interface SendPushNotificationOptions {
	targetType: "all" | "timezone" | "user";
	targetValue?: string; // timezone name or user ID
	scheduledFor?: Date;
	createdBy: string | null; // null for system-generated notifications
}

/**
 * Get localized title and message based on user language
 */
function getLocalizedContent(
	campaignData: {
		title: string;
		message: string;
		titleEn?: string | null;
		messageEn?: string | null;
		titleNo?: string | null;
		messageNo?: string | null;
		titleEs?: string | null;
		messageEs?: string | null;
		titleDe?: string | null;
		messageDe?: string | null;
	},
	userLanguage: string
): { title: string; message: string } {
	switch (userLanguage) {
		case "en":
			return {
				title: campaignData.titleEn || campaignData.title,
				message: campaignData.messageEn || campaignData.message,
			};
		case "no":
			return {
				title: campaignData.titleNo || campaignData.title,
				message: campaignData.messageNo || campaignData.message,
			};
		case "es":
			return {
				title: campaignData.titleEs || campaignData.title,
				message: campaignData.messageEs || campaignData.message,
			};
		case "de":
			return {
				title: campaignData.titleDe || campaignData.title,
				message: campaignData.messageDe || campaignData.message,
			};
		default:
			return {
				title: campaignData.titleEn || campaignData.title,
				message: campaignData.messageEn || campaignData.message,
			};
	}
}

/**
 * Register a push token for a user
 */
export async function registerPushToken(
	userId: string,
	token: string,
	deviceId?: string,
	platform: "ios" | "android" = "ios"
) {
	// Validate the token
	if (!Expo.isExpoPushToken(token)) {
		throw new Error("Invalid Expo push token");
	}

	// Check if token already exists for this user
	const existingToken = await db
		.select()
		.from(pushTokens)
		.where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
		.limit(1);

	if (existingToken.length > 0) {
		// Update existing token
		await db
			.update(pushTokens)
			.set({
				isActive: true,
				deviceId,
				platform,
				updatedAt: new Date(),
			})
			.where(eq(pushTokens.id, existingToken[0].id));

		return existingToken[0].id;
	}

	// Create new token
	const tokenId = nanoid();
	await db.insert(pushTokens).values({
		id: tokenId,
		userId,
		token,
		deviceId,
		platform,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return tokenId;
}

/**
 * Deactivate a push token
 */
export async function deactivatePushToken(userId: string, token: string) {
	await db
		.update(pushTokens)
		.set({
			isActive: false,
			updatedAt: new Date(),
		})
		.where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}

/**
 * Get active push tokens for users with session validation
 */
export async function getActivePushTokens(
	userIds?: string[],
	timezone?: string
) {
	const conditions = [
		eq(pushTokens.isActive, true),
		gt(session.expiresAt, new Date()), // Only include tokens for users with active sessions
	];

	if (userIds && userIds.length > 0) {
		conditions.push(inArray(pushTokens.userId, userIds));
	}

	if (timezone) {
		conditions.push(eq(user.timezone, timezone));
	}

	const tokensWithSessions = await db
		.select({
			tokenId: pushTokens.id,
			userId: pushTokens.userId,
			token: pushTokens.token,
			platform: pushTokens.platform,
			userTimezone: user.timezone,
			userLanguage: user.language,
		})
		.from(pushTokens)
		.innerJoin(user, eq(pushTokens.userId, user.id))
		.innerJoin(session, eq(pushTokens.userId, session.userId))
		.where(and(...conditions));

	// Deactivate tokens for users without active sessions
	await deactivateTokensForInactiveSessions();

	return tokensWithSessions;
}

/**
 * Deactivate push tokens for users without active sessions
 */
export async function deactivateTokensForInactiveSessions() {
	try {
		// Get all active tokens
		const activeTokens = await db
			.select({
				tokenId: pushTokens.id,
				userId: pushTokens.userId,
				token: pushTokens.token,
			})
			.from(pushTokens)
			.where(eq(pushTokens.isActive, true));

		if (activeTokens.length === 0) {
			return;
		}

		// Get users with active sessions
		const usersWithActiveSessions = await db
			.selectDistinct({
				userId: session.userId,
			})
			.from(session)
			.where(gt(session.expiresAt, new Date()));

		const activeUserIds = new Set(usersWithActiveSessions.map((u) => u.userId));

		// Find tokens for users without active sessions
		const tokensToDeactivate = activeTokens.filter(
			(token) => !activeUserIds.has(token.userId)
		);

		if (tokensToDeactivate.length > 0) {
			const tokenIds = tokensToDeactivate.map((t) => t.tokenId);
			await db
				.update(pushTokens)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(inArray(pushTokens.id, tokenIds));

			console.log(
				`🔒 Deactivated ${tokensToDeactivate.length} tokens for users without active sessions`
			);
		}
	} catch (error) {
		console.error("Error deactivating tokens for inactive sessions:", error);
	}
}

/**
 * Deactivate all push tokens for a specific user (used during logout)
 */
export async function deactivateAllUserTokens(userId: string) {
	try {
		const result = await db
			.update(pushTokens)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(and(eq(pushTokens.userId, userId), eq(pushTokens.isActive, true)));

		console.log(`🔒 Deactivated all push tokens for user ${userId}`);
		return result;
	} catch (error) {
		console.error("Error deactivating user tokens:", error);
		throw error;
	}
}

/**
 * Validate and clean up tokens before sending notifications
 */
export async function validateAndCleanupTokens(): Promise<void> {
	try {
		// Run session validation cleanup
		await deactivateTokensForInactiveSessions();

		// Additional cleanup: Remove tokens that have been failing consistently
		// This could be expanded to track failed delivery attempts
		console.log("🔍 Token validation and cleanup completed");
	} catch (error) {
		console.error("Error during token validation and cleanup:", error);
	}
}

/**
 * Create a push notification campaign
 */
export async function createPushCampaign(
	notificationData: PushNotificationData,
	options: SendPushNotificationOptions
): Promise<string> {
	const campaignId = nanoid();

	await db.insert(pushCampaigns).values({
		id: campaignId,
		title: notificationData.title,
		message: notificationData.message,
		titleEn: notificationData.titleEn,
		messageEn: notificationData.messageEn,
		titleNo: notificationData.titleNo,
		messageNo: notificationData.messageNo,
		titleEs: notificationData.titleEs,
		messageEs: notificationData.messageEs,
		titleDe: notificationData.titleDe,
		messageDe: notificationData.messageDe,
		data: notificationData.data,
		targetType: options.targetType,
		targetValue: options.targetValue,
		scheduledFor: options.scheduledFor,
		status: "pending",
		createdBy: options.createdBy,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	return campaignId;
}

/**
 * Send push notifications for a campaign
 */
export async function sendPushCampaign(campaignId: string): Promise<void> {
	// Get campaign details
	const campaign = await db
		.select()
		.from(pushCampaigns)
		.where(eq(pushCampaigns.id, campaignId))
		.limit(1);

	if (campaign.length === 0) {
		throw new Error("Campaign not found");
	}

	const campaignData = campaign[0];

	// Update campaign status to sending
	await db
		.update(pushCampaigns)
		.set({ status: "sending", updatedAt: new Date() })
		.where(eq(pushCampaigns.id, campaignId));

	try {
		// Validate and cleanup tokens before sending
		await validateAndCleanupTokens();

		// Get target tokens based on campaign type
		let tokens;
		if (campaignData.targetType === "all") {
			tokens = await getActivePushTokens();
		} else if (campaignData.targetType === "timezone") {
			tokens = await getActivePushTokens(undefined, campaignData.targetValue!);
		} else if (campaignData.targetType === "user") {
			tokens = await getActivePushTokens([campaignData.targetValue!]);
		} else {
			throw new Error("Invalid target type");
		}

		if (tokens.length === 0) {
			await db
				.update(pushCampaigns)
				.set({ status: "completed", updatedAt: new Date() })
				.where(eq(pushCampaigns.id, campaignId));
			return;
		}

		// Prepare messages with localized content
		const messages: ExpoPushMessage[] = tokens.map((tokenData) => {
			const localizedContent = getLocalizedContent(
				campaignData,
				tokenData.userLanguage || "en"
			);
			return {
				to: tokenData.token,
				title: localizedContent.title,
				body: localizedContent.message,
				data: (campaignData.data as Record<string, unknown>) || {
					campaignId: campaignId,
				},
				sound: "default",
			};
		});

		// Send messages in chunks
		const chunks = expo.chunkPushNotifications(messages);
		let sentCount = 0;
		let failedCount = 0;

		for (const chunk of chunks) {
			try {
				const tickets = await expo.sendPushNotificationsAsync(chunk);

				// Process tickets and create receipts
				for (let i = 0; i < tickets.length; i++) {
					const ticket = tickets[i];
					const tokenData = tokens[sentCount + i];
					const receiptId = nanoid();

					if (ticket.status === "ok") {
						await db.insert(pushReceipts).values({
							id: receiptId,
							campaignId,
							userId: tokenData.userId,
							tokenId: tokenData.tokenId,
							status: "sent",
							receiptId: ticket.id,
							sentAt: new Date(),
						});
						sentCount++;
					} else {
						await db.insert(pushReceipts).values({
							id: receiptId,
							campaignId,
							userId: tokenData.userId,
							tokenId: tokenData.tokenId,
							status: "failed",
							errorMessage: ticket.message,
							sentAt: new Date(),
						});
						failedCount++;

						// Deactivate invalid tokens
						if (ticket.details?.error === "DeviceNotRegistered") {
							await deactivatePushToken(tokenData.userId, tokenData.token);
						}
					}
				}
			} catch (error) {
				console.error("Error sending push notification chunk:", error);
				failedCount += chunk.length;
			}
		}

		// Update campaign with final counts
		await db
			.update(pushCampaigns)
			.set({
				status: "completed",
				sentCount,
				failedCount,
				updatedAt: new Date(),
			})
			.where(eq(pushCampaigns.id, campaignId));
	} catch (error) {
		console.error("Error sending push campaign:", error);
		await db
			.update(pushCampaigns)
			.set({ status: "failed", updatedAt: new Date() })
			.where(eq(pushCampaigns.id, campaignId));
		throw error;
	}
}

/**
 * Send immediate push notification
 */
export async function sendImmediatePushNotification(
	notificationData: PushNotificationData,
	options: SendPushNotificationOptions
): Promise<string> {
	const campaignId = await createPushCampaign(notificationData, options);
	await sendPushCampaign(campaignId);
	return campaignId;
}

/**
 * Get all timezones from users
 */
export async function getUserTimezones(): Promise<string[]> {
	const timezones = await db
		.selectDistinct({ timezone: user.timezone })
		.from(user)
		.where(eq(user.onboardingCompleted, true));

	return timezones
		.map((t) => t.timezone)
		.filter((tz): tz is string => tz !== null);
}

/**
 * Schedule push notifications for specific local times
 */
export async function schedulePushNotificationForLocalTime(
	notificationData: PushNotificationData,
	localHour: number, // 0-23
	localMinute: number, // 0-59
	createdBy: string
): Promise<string[]> {
	const timezones = await getUserTimezones();
	const campaignIds: string[] = [];

	for (const timezone of timezones) {
		// Calculate the next occurrence of the specified local time in this timezone
		const now = new Date();
		const scheduledDate = new Date();

		// This is a simplified calculation - in production you'd want to use a proper timezone library
		// For now, we'll schedule for the next occurrence of the specified time
		scheduledDate.setHours(localHour, localMinute, 0, 0);

		// If the time has already passed today, schedule for tomorrow
		if (scheduledDate <= now) {
			scheduledDate.setDate(scheduledDate.getDate() + 1);
		}

		const campaignId = await createPushCampaign(notificationData, {
			targetType: "timezone",
			targetValue: timezone,
			scheduledFor: scheduledDate,
			createdBy,
		});

		campaignIds.push(campaignId);
	}

	return campaignIds;
}
