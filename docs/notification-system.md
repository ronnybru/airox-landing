# Notification System Guide

## Overview

The notification system allows sending and managing user notifications. Notifications can be targeted to specific users, organizations, or sent system-wide.

## Types of Notifications

- `system` - System-wide notifications
- `info` - General information
- `success` - Success messages
- `warning` - Warning alerts
- `error` - Error messages
- `product_sold` - Product sales notifications
- `message` - User messages

## Notification Targets

Notifications can be sent to different targets:

- **User**: Sent to a specific user
- **Organization**: Sent to all members of a specific organization
- **All Organizations**: Sent to all organizations in the system
- **System-wide**: Sent to all users in the system

### Organization Notifications

Organization notifications are visible to all members of the organization. They can be configured with:

- **Single-read dismissal**: When enabled, the notification is marked as read for all organization members when any member reads it. This is useful for notifications that only need to be acknowledged by one team member.

## Creating Notifications

### For Developers

```typescript
// Import the notification functions
import {
	createNotification,
	createOrganizationNotification,
} from "@/lib/notifications";

// Create a notification for a specific user
await createNotification({
	userId: "user-id-here", // Optional (omit for system-wide)
	type: "info", // Type of notification
	title: "Your Title",
	message: "Your message content",
	data: {
		// Optional additional data
		links: [
			{
				// Optional clickable links
				text: "Click here",
				url: "/some-page",
				isExternal: false, // Opens in same tab
			},
		],
	},
	groupKey: "optional-group-key", // For grouping similar notifications
});

// Create a notification for an organization
await createOrganizationNotification({
	organizationId: "organization-id-here", // Required
	singleReadDismissal: true, // Optional (defaults to false)
	type: "info",
	title: "Organization Notification",
	message: "This notification is for all members of the organization",
	data: {
		// Optional additional data
		links: [
			{
				text: "View details",
				url: "/dashboard",
				isExternal: false,
			},
		],
	},
	groupKey: "optional-group-key", // For grouping similar notifications
});

// Create a notification for all organizations
await createAllOrganizationsNotification({
	singleReadDismissal: true, // Optional (defaults to false)
	type: "info",
	title: "All Organizations Notification",
	message: "This notification is for all organizations in the system",
	data: {
		// Optional additional data
		links: [
			{
				text: "View details",
				url: "/settings",
				isExternal: false,
			},
		],
	},
	groupKey: "optional-group-key", // For grouping similar notifications
});

// Helper functions for common notifications
import {
	createProductSoldNotification,
	createMessageNotification,
} from "@/lib/notifications";

// Product sold notification
await createProductSoldNotification(userId, "Product Name", quantity);

// Message notification
await createMessageNotification(userId, "Sender Name", messageCount);
```

### For Admins

Admins can create notifications through the admin interface at `/admin/notifications`. The interface allows:

- Sending notifications to all users
- Sending notifications to specific users
- Sending notifications to specific organizations (with optional single-read dismissal)
- Sending notifications to all organizations (with optional single-read dismissal)

## Displaying Notifications

The notification dropdown automatically shows in the navigation when a user is logged in. It:

- Shows unread notification count
- Polls for new notifications every 30 seconds
- Allows marking notifications as read
- Displays notification details on click

## Managing Notifications

```typescript
// Import the notification actions
import {
	getNotifications,
	getNotificationCount,
	markAsRead,
	markAllAsRead,
	removeNotification,
} from "@/app/actions/notifications";

// Get user's notifications
const notifications = await getNotifications(10, false); // limit, includeRead

// Get unread count
const count = await getNotificationCount();

// Mark as read
await markAsRead(notificationId);

// Mark all as read
await markAllAsRead();

// Delete notification
await removeNotification(notificationId);
```

## Features

- **Grouping**: Similar notifications are grouped using `groupKey`
- **Rich Content**: Support for embedded links in notification messages
- **Notification Types**: Visual differentiation based on notification type
- **Read Status**: Track read/unread status for each user
- **Organization Notifications**: Send notifications to all members of an organization
- **Single-read Dismissal**: Organization notifications can be configured to be marked as read for all members when one member reads it
