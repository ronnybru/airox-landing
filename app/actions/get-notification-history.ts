"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { requireServerSession } from "@/lib/session";

export interface NotificationHistoryRecord {
	id: number;
	type: string;
	title: string;
	message: string;
	createdAt: Date;
	userCount: number;
	organizationId: string | null;
	singleReadDismissal: boolean;
	target: "user" | "organization" | "system";
}

/**
 * Get notification history for admin view
 */
export async function getNotificationHistory(page = 1, pageSize = 10) {
	try {
		// Ensure user is admin
		const session = await requireServerSession();
		if (session.user.role !== "admin") {
			throw new Error("Unauthorized: Admin role required");
		}

		const result = await db
			.select({
				id: notifications.id,
				type: notifications.type,
				title: notifications.title,
				message: notifications.message,
				createdAt: notifications.createdAt,
				organizationId: notifications.organizationId,
				singleReadDismissal: notifications.singleReadDismissal,
				userCount: sql<number>`count(distinct ${notifications.userId})`.as(
					"user_count"
				),
			})
			.from(notifications)
			.groupBy(
				notifications.groupKey,
				notifications.id,
				notifications.type,
				notifications.title,
				notifications.message,
				notifications.createdAt,
				notifications.organizationId,
				notifications.singleReadDismissal
			)
			.orderBy(desc(notifications.createdAt))
			.limit(pageSize)
			.offset((page - 1) * pageSize);

		// Check if there are more records
		const totalCount = await db
			.select({ count: sql<number>`count(distinct ${notifications.groupKey})` })
			.from(notifications);

		const hasMore = totalCount[0].count > page * pageSize;

		return {
			notifications: result.map((item) => ({
				...item,
				createdAt: item.createdAt,
				// Determine the target based on userId and organizationId
				target: item.organizationId
					? "organization"
					: item.userCount > 0
						? "user"
						: "system",
			})),
			hasMore,
		};
	} catch (error) {
		console.error("Error fetching notification history:", error);
		throw error;
	}
}
