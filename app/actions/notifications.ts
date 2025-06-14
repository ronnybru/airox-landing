"use server";

import {
	createNotification,
	createSystemNotification,
	createOrganizationNotification,
	createAllOrganizationsNotification,
	getUserNotifications,
	getUnreadNotificationCount,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
	type NotificationType,
	type CreateNotificationParams,
} from "@/lib/notifications";
import { requireServerSession } from "@/lib/session";

/**
 * Get notifications for the current user
 */
export async function getNotifications(limit = 10, includeRead = false) {
	return getUserNotifications(limit, includeRead);
}

/**
 * Get the count of unread notifications for the current user
 */
export async function getNotificationCount() {
	return getUnreadNotificationCount();
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: number) {
	return markNotificationAsRead(notificationId);
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead() {
	return markAllNotificationsAsRead();
}

/**
 * Delete a notification
 */
export async function removeNotification(notificationId: number) {
	return deleteNotification(notificationId);
}

/**
 * Create a notification for a specific user
 * This is protected and requires admin role
 */
export async function createUserNotification(params: CreateNotificationParams) {
	const session = await requireServerSession();

	// Check if user is admin
	if (session.user.role !== "admin") {
		throw new Error("Unauthorized: Admin role required");
	}

	return createNotification(params);
}

/**
 * Create a notification for all users
 * This is protected and requires admin role
 */
export async function createNotificationForAllUsers(
	type: NotificationType,
	title: string,
	message: string,
	data?: Record<string, unknown>
) {
	const session = await requireServerSession();

	// Check if user is admin
	if (session.user.role !== "admin") {
		throw new Error("Unauthorized: Admin role required");
	}

	return createSystemNotification({
		type,
		title,
		message,
		data,
	});
}

/**
 * Create a notification for an organization
 * This is protected and requires admin role
 */
export async function createOrganizationNotificationAction(
	organizationId: string,
	type: NotificationType,
	title: string,
	message: string,
	singleReadDismissal: boolean = false,
	data?: Record<string, unknown>,
	groupKey?: string
) {
	const session = await requireServerSession();

	// Check if user is admin
	if (session.user.role !== "admin") {
		throw new Error("Unauthorized: Admin role required");
	}

	return createOrganizationNotification({
		organizationId,
		type,
		title,
		message,
		singleReadDismissal,
		data,
		groupKey,
	});
}

/**
 * Create a notification for all organizations
 * This is protected and requires admin role
 */
export async function createAllOrganizationsNotificationAction(
	type: NotificationType,
	title: string,
	message: string,
	singleReadDismissal: boolean = false,
	data?: Record<string, unknown>,
	groupKey?: string
) {
	const session = await requireServerSession();

	// Check if user is admin
	if (session.user.role !== "admin") {
		throw new Error("Unauthorized: Admin role required");
	}

	return createAllOrganizationsNotification({
		type,
		title,
		message,
		singleReadDismissal,
		data,
		groupKey,
	});
}
