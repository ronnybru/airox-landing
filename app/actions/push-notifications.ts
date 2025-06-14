"use server";

import { requireServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import { pushCampaigns, user } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import {
	sendImmediatePushNotification,
	schedulePushNotificationForLocalTime,
} from "@/lib/push-notifications";

interface SendPushNotificationParams {
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
	action?: string; // Deep link action
	targetType: "all" | "local_time" | "user";
	userId?: string;
	localHour?: number;
	localMinute?: number;
}

export async function sendPushNotificationAction(
	params: SendPushNotificationParams
) {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Check if user is admin
		const currentUser = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (currentUser.length === 0 || currentUser[0].role !== "admin") {
			return { success: false, error: "Admin access required" };
		}

		const {
			title,
			message,
			titleEn,
			messageEn,
			titleNo,
			messageNo,
			titleEs,
			messageEs,
			titleDe,
			messageDe,
			action,
			targetType,
			userId,
			localHour,
			localMinute,
		} = params;

		const notificationData = {
			title,
			message,
			titleEn,
			messageEn,
			titleNo,
			messageNo,
			titleEs,
			messageEs,
			titleDe,
			messageDe,
			data: action ? { action } : undefined,
		};

		if (targetType === "all") {
			// Send to everyone immediately
			const campaignId = await sendImmediatePushNotification(notificationData, {
				targetType: "all",
				createdBy: session.user.id,
			});
			return { success: true, campaignId };
		} else if (targetType === "local_time") {
			// Schedule for local time
			if (localHour === undefined || localMinute === undefined) {
				return { success: false, error: "Local time is required" };
			}

			const campaignIds = await schedulePushNotificationForLocalTime(
				notificationData,
				localHour,
				localMinute,
				session.user.id
			);
			return { success: true, campaignIds };
		} else if (targetType === "user") {
			// Send to specific user
			if (!userId) {
				return { success: false, error: "User ID is required" };
			}

			const campaignId = await sendImmediatePushNotification(notificationData, {
				targetType: "user",
				targetValue: userId,
				createdBy: session.user.id,
			});
			return { success: true, campaignId };
		}

		return { success: false, error: "Invalid target type" };
	} catch (error) {
		console.error("Error sending push notification:", error);
		return { success: false, error: "Failed to send push notification" };
	}
}

export async function getPushCampaignHistoryAction() {
	try {
		const session = await requireServerSession();
		if (!session?.user?.id) {
			return { success: false, error: "Not authenticated" };
		}

		// Check if user is admin
		const currentUser = await db
			.select()
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (currentUser.length === 0 || currentUser[0].role !== "admin") {
			return { success: false, error: "Admin access required" };
		}

		// Get campaign history
		const campaigns = await db
			.select({
				id: pushCampaigns.id,
				title: pushCampaigns.title,
				message: pushCampaigns.message,
				targetType: pushCampaigns.targetType,
				targetValue: pushCampaigns.targetValue,
				status: pushCampaigns.status,
				sentCount: pushCampaigns.sentCount,
				deliveredCount: pushCampaigns.deliveredCount,
				failedCount: pushCampaigns.failedCount,
				scheduledFor: pushCampaigns.scheduledFor,
				createdAt: pushCampaigns.createdAt,
				createdBy: pushCampaigns.createdBy,
			})
			.from(pushCampaigns)
			.orderBy(desc(pushCampaigns.createdAt))
			.limit(50);

		return { success: true, campaigns };
	} catch (error) {
		console.error("Error getting campaign history:", error);
		return { success: false, error: "Failed to load campaign history" };
	}
}
