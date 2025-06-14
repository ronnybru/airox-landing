import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, isNull, sql, or } from "drizzle-orm";
import { getCurrentUserId, getActiveOrganization } from "@/lib/session";

export type NotificationType =
	| "system"
	| "product_sold"
	| "message"
	| "info"
	| "warning"
	| "success"
	| "error";

export interface CreateNotificationParams {
	userId?: string; // Optional for system-wide or organization notifications
	organizationId?: string; // Optional for user-specific or system-wide notifications
	singleReadDismissal?: boolean; // If true, notification is dismissed for all org members when one reads it
	type: NotificationType;
	title: string;
	message: string;
	data?: {
		links?: Array<{
			text: string;
			url: string;
			isExternal?: boolean;
		}>;
		[key: string]: unknown;
	}; // Additional data for the notification
	groupKey?: string; // For grouping similar notifications
}

/**
 * Create a new notification
 * If a groupKey is provided and a notification with the same groupKey exists,
 * the existing notification will be updated with an incremented groupCount
 */
export async function createNotification({
	userId,
	organizationId,
	singleReadDismissal = false,
	type,
	title,
	message,
	data,
	groupKey,
}: CreateNotificationParams) {
	try {
		// If groupKey is provided, check if a notification with the same groupKey exists
		if (groupKey) {
			const whereConditions = [
				eq(notifications.groupKey, groupKey),
				eq(notifications.read, false),
			];

			// Add user or organization condition
			if (userId) {
				whereConditions.push(eq(notifications.userId, userId));
			} else if (organizationId) {
				whereConditions.push(eq(notifications.organizationId, organizationId));
			} else {
				whereConditions.push(isNull(notifications.userId));
				whereConditions.push(isNull(notifications.organizationId));
			}

			const existingNotification = await db.query.notifications.findFirst({
				where: and(...whereConditions),
			});

			if (existingNotification) {
				// Update the existing notification
				await db
					.update(notifications)
					.set({
						groupCount: existingNotification.groupCount
							? existingNotification.groupCount + 1
							: 2,
						updatedAt: new Date(),
						// Update the message to reflect the group count
						message: message,
						title: title,
						data: data as Record<string, unknown>,
					})
					.where(eq(notifications.id, existingNotification.id));

				return existingNotification.id;
			}
		}

		// Create a new notification
		const [newNotification] = await db
			.insert(notifications)
			.values({
				userId,
				organizationId,
				singleReadDismissal,
				type,
				title,
				message,
				data: data as Record<string, unknown>,
				groupKey,
				groupCount: 1,
				read: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning({ id: notifications.id });

		return newNotification.id;
	} catch (error) {
		console.error("Error creating notification:", error);
		throw error;
	}
}

/**
 * Create a notification for all users
 */
export async function createSystemNotification({
	type,
	title,
	message,
	data,
}: Omit<CreateNotificationParams, "userId" | "groupKey">) {
	try {
		// Get all users
		const users = await db.query.user.findMany({
			columns: {
				id: true,
			},
		});

		// Create a notification for each user
		const notificationIds = await Promise.all(
			users.map((user) =>
				createNotification({
					userId: user.id,
					type,
					title,
					message,
					data,
				})
			)
		);

		return notificationIds;
	} catch (error) {
		console.error("Error creating system notification:", error);
		throw error;
	}
}

/**
 * Create a notification for an organization
 * This will create a notification that is visible to all members of the organization
 */
export async function createOrganizationNotification({
	organizationId,
	singleReadDismissal = false,
	type,
	title,
	message,
	data,
	groupKey,
}: Omit<CreateNotificationParams, "userId"> & { organizationId: string }) {
	try {
		return createNotification({
			organizationId,
			singleReadDismissal,
			type,
			title,
			message,
			data,
			groupKey,
		});
	} catch (error) {
		console.error("Error creating organization notification:", error);
		throw error;
	}
}

/**
 * Create a notification for all organizations
 * This will create a notification for each organization in the system
 * with the same content
 */
export async function createAllOrganizationsNotification({
	singleReadDismissal = false,
	type,
	title,
	message,
	data,
	groupKey,
}: Omit<CreateNotificationParams, "userId" | "organizationId"> & {
	singleReadDismissal?: boolean;
}) {
	try {
		// Get all organizations
		const organizations = await db.query.organization.findMany({
			columns: {
				id: true,
			},
		});

		// Create a notification for each organization
		const notificationIds = await Promise.all(
			organizations.map((org) =>
				createOrganizationNotification({
					organizationId: org.id,
					singleReadDismissal,
					type,
					title,
					message,
					data,
					groupKey: groupKey ? `${groupKey}_${org.id}` : undefined,
				})
			)
		);

		return notificationIds;
	} catch (error) {
		console.error("Error creating notifications for all organizations:", error);
		throw error;
	}
}

/**
 * Get notifications for the current user
 * This includes:
 * 1. User's personal notifications
 * 2. Organization notifications for the user's active organization
 */
export async function getUserNotifications(limit = 10, includeRead = false) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return [];

		// Get the user's active organization
		const activeOrg = await getActiveOrganization();
		const activeOrgId = activeOrg?.id;

		// Build the where conditions
		const whereConditions = [];

		if (activeOrgId) {
			whereConditions.push(
				or(
					eq(notifications.userId, userId),
					eq(notifications.organizationId, activeOrgId)
				)
			);
		} else {
			whereConditions.push(eq(notifications.userId, userId));
		}

		if (!includeRead) {
			whereConditions.push(eq(notifications.read, false));
		}

		return db.query.notifications.findMany({
			where: and(...whereConditions),
			orderBy: [desc(notifications.createdAt)],
			limit,
		});
	} catch (error) {
		console.error("Error getting user notifications:", error);
		return [];
	}
}

/**
 * Get the count of unread notifications for the current user
 * This includes:
 * 1. User's personal notifications
 * 2. Organization notifications for the user's active organization
 */
export async function getUnreadNotificationCount() {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return 0;

		// Get the user's active organization
		const activeOrg = await getActiveOrganization();
		const activeOrgId = activeOrg?.id;

		const result = await db
			.select({ count: sql<number>`count(*)` })
			.from(notifications)
			.where(
				and(
					activeOrgId
						? or(
								eq(notifications.userId, userId),
								eq(notifications.organizationId, activeOrgId)
							)
						: eq(notifications.userId, userId),
					eq(notifications.read, false)
				)
			);

		return result[0]?.count || 0;
	} catch (error) {
		console.error("Error getting unread notification count:", error);
		return 0;
	}
}

/**
 * Mark a notification as read
 * If the notification is an organization notification with singleReadDismissal=true,
 * it will be marked as read for all members of the organization
 */
export async function markNotificationAsRead(notificationId: number) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return false;

		// Get the notification to check if it's an organization notification with singleReadDismissal
		const notification = await db.query.notifications.findFirst({
			where: eq(notifications.id, notificationId),
		});

		if (!notification) return false;

		// If it's a user notification, mark it as read for the user
		if (notification.userId === userId) {
			await db
				.update(notifications)
				.set({ read: true, updatedAt: new Date() })
				.where(
					and(
						eq(notifications.id, notificationId),
						eq(notifications.userId, userId)
					)
				);
			return true;
		}

		// If it's an organization notification
		if (notification.organizationId) {
			// Get the user's active organization
			const activeOrg = await getActiveOrganization();

			// Check if the user is a member of the organization
			if (activeOrg?.id !== notification.organizationId) {
				return false;
			}

			// If singleReadDismissal is true, mark it as read for all members
			if (notification.singleReadDismissal) {
				await db
					.update(notifications)
					.set({ read: true, updatedAt: new Date() })
					.where(eq(notifications.id, notificationId));
			} else {
				// Otherwise, create a user-specific read record
				// We'll mark it as read by creating a user-specific copy that is already read
				const [userNotification] = await db
					.insert(notifications)
					.values({
						userId,
						type: notification.type,
						title: notification.title,
						message: notification.message,
						data: notification.data,
						groupKey: `user-read-${notificationId}`,
						read: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning({ id: notifications.id });

				return !!userNotification;
			}
			return true;
		}

		return false;
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return false;
	}
}

/**
 * Mark all notifications as read for the current user
 * This includes:
 * 1. User's personal notifications
 * 2. Organization notifications with singleReadDismissal=true
 * 3. Creates user-specific read records for organization notifications with singleReadDismissal=false
 */
export async function markAllNotificationsAsRead() {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return false;

		// Get the user's active organization
		const activeOrg = await getActiveOrganization();
		const activeOrgId = activeOrg?.id;

		// Mark user's personal notifications as read
		await db
			.update(notifications)
			.set({ read: true, updatedAt: new Date() })
			.where(
				and(eq(notifications.userId, userId), eq(notifications.read, false))
			);

		// If user has an active organization
		if (activeOrgId) {
			// Get all unread organization notifications for the active organization
			const orgNotifications = await db.query.notifications.findMany({
				where: and(
					eq(notifications.organizationId, activeOrgId),
					eq(notifications.read, false)
				),
			});

			// Process each organization notification
			for (const notification of orgNotifications) {
				if (notification.singleReadDismissal) {
					// Mark single-read-dismissal notifications as read for all
					await db
						.update(notifications)
						.set({ read: true, updatedAt: new Date() })
						.where(eq(notifications.id, notification.id));
				} else {
					// Create user-specific read records for other org notifications
					await db.insert(notifications).values({
						userId,
						type: notification.type,
						title: notification.title,
						message: notification.message,
						data: notification.data,
						groupKey: `user-read-${notification.id}`,
						read: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					});
				}
			}
		}

		return true;
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return false;
	}
}

/**
 * Delete a notification
 * For organization notifications with singleReadDismissal=false, this will only delete
 * the user-specific read record, not the actual organization notification
 */
export async function deleteNotification(notificationId: number) {
	try {
		const userId = await getCurrentUserId();
		if (!userId) return false;

		// Get the notification to check if it's an organization notification
		const notification = await db.query.notifications.findFirst({
			where: eq(notifications.id, notificationId),
		});

		if (!notification) return false;

		// If it's a user notification, delete it
		if (notification.userId === userId) {
			await db
				.delete(notifications)
				.where(
					and(
						eq(notifications.id, notificationId),
						eq(notifications.userId, userId)
					)
				);
			return true;
		}

		// If it's an organization notification
		if (notification.organizationId) {
			// Get the user's active organization
			const activeOrg = await getActiveOrganization();

			// Check if the user is a member of the organization
			if (activeOrg?.id !== notification.organizationId) {
				return false;
			}

			// If singleReadDismissal is true, only admins can delete it
			if (notification.singleReadDismissal) {
				// Check if user is admin or owner
				const isAdmin = activeOrg.members.some(
					(m) =>
						m.userId === userId && (m.role === "admin" || m.role === "owner")
				);

				if (isAdmin) {
					await db
						.delete(notifications)
						.where(eq(notifications.id, notificationId));
					return true;
				}

				// Non-admins can only mark as read
				return await markNotificationAsRead(notificationId);
			} else {
				// For regular org notifications, create a user-specific read record
				// to hide it from this user
				const [userNotification] = await db
					.insert(notifications)
					.values({
						userId,
						type: notification.type,
						title: notification.title,
						message: notification.message,
						data: notification.data,
						groupKey: `user-read-${notificationId}`,
						read: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning({ id: notifications.id });

				return !!userNotification;
			}
		}

		return false;
	} catch (error) {
		console.error("Error deleting notification:", error);
		return false;
	}
}

/**
 * Helper function to create a product sold notification
 */
export async function createProductSoldNotification(
	userId: string,
	productName: string,
	quantity: number = 1
) {
	const groupKey = `product_sold_${productName}`;
	const title = "Product Sold";
	const message =
		quantity > 1
			? `${quantity} ${productName} items have been sold`
			: `A ${productName} has been sold`;

	return createNotification({
		userId,
		type: "product_sold",
		title,
		message,
		data: { productName, quantity },
		groupKey,
	});
}

/**
 * Helper function to create a message notification
 */
export async function createMessageNotification(
	userId: string,
	fromUser: string,
	messageCount: number = 1
) {
	const groupKey = `message_from_${fromUser}`;
	const title = "New Message";
	const message =
		messageCount > 1
			? `You have ${messageCount} new messages from ${fromUser}`
			: `You have a new message from ${fromUser}`;

	return createNotification({
		userId,
		type: "message",
		title,
		message,
		data: { fromUser, messageCount },
		groupKey,
	});
}
