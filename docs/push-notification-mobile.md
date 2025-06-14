# Push Notifications for Mobile App

This document outlines the push notification system implementation for the mobile application, including setup, usage, and administration.

## 🚀 Implementation Status

### ✅ COMPLETED

- **Backend Setup**: Expo access token configured, dependencies installed
- **Database Schema**: Push notification tables created and migrated
- **Mobile Dependencies**: expo-notifications, expo-device, expo-constants installed
- **App Configuration**: app.json updated with notification settings
- **Push Hook**: Complete usePushNotifications hook implemented
- **Main App Integration**: Hook initialized in app/\_layout.tsx
- **Automatic Features**: Token registration, timezone sync, notification handling

### 🧪 READY FOR TESTING

The system is fully implemented and ready for comprehensive testing on physical devices.

## Overview

The push notification system allows administrators to send real-time notifications to mobile app users. It supports:

- **Immediate notifications** to all users
- **Scheduled notifications** at users' local times
- **Targeted notifications** to specific users
- **Timezone-aware delivery** for better user engagement

## Architecture

### Backend Components

1. **Database Schema** (`backend/lib/db/schema.ts`)

   - `user.timezone` - User's timezone (auto-detected on registration)
   - `push_tokens` - Device push tokens for each user
   - `push_campaigns` - Notification campaigns and their metadata
   - `push_receipts` - Delivery tracking and status

2. **Push Notification Service** (`backend/lib/push-notifications.ts`)

   - Token registration and management
   - Campaign creation and execution
   - Delivery tracking and error handling
   - Timezone-based scheduling

3. **Admin Interface** (`backend/app/(admin)/push-notifications/`)

   - Web interface for sending notifications
   - Campaign history and analytics
   - Real-time delivery status

4. **API Endpoints**
   - `POST /api/push-tokens` - Register/update push tokens
   - `DELETE /api/push-tokens` - Deactivate push tokens
   - `PATCH /api/user/personal-details` - Update user timezone

### Mobile Components

The mobile app needs to integrate with Expo's push notification system:

1. **Token Registration** - Register device tokens with the backend
2. **Timezone Detection** - Auto-detect and send user's timezone
3. **Notification Handling** - Handle incoming push notifications

## Setup Instructions

### 1. Backend Setup ✅ COMPLETED

#### Install Dependencies ✅

```bash
cd backend
npm install expo-server-sdk
```

#### Environment Variables ✅

Add to your `.env` file:

```env
EXPO_ACCESS_TOKEN=Y2hLgGJ4uJC_2TXHtHNgKp9U3k81mFzzmQRir9ZU
```

#### Database Migration ✅

Run the migration to add push notification tables:

```bash
npm run db:push
```

### 2. Mobile App Setup ✅ COMPLETED

#### Install Expo Notifications ✅

```bash
cd mobile
npx expo install expo-notifications expo-device expo-constants
```

#### Configure Push Notifications ✅

Updated `app.json` with:

```json
{
	"expo": {
		"notification": {
			"icon": "./assets/images/icon.png",
			"color": "#ffffff"
		},
		"plugins": [
			"expo-router",
			[
				"expo-notifications",
				{
					"icon": "./assets/images/icon.png",
					"color": "#ffffff"
				}
			]
		]
	}
}
```

#### Push Notification Hook ✅

Created `mobile/hooks/usePushNotifications.ts` with:

- Automatic token registration
- Permission handling
- Notification listeners
- Timezone synchronization

#### Main App Integration ✅

Updated `mobile/app/_layout.tsx` to initialize push notifications on app startup.

## Usage

### Admin Interface

1. **Access Admin Panel**

   - Navigate to `/admin/push-notifications`
   - Requires admin role

2. **Send Notifications**

   - **Send to Everyone Now**: Immediate delivery to all users
   - **Send at Local Time**: Schedule for specific time in each user's timezone
   - **Send to Specific User**: Target individual users
   - **Deep Link Action**: Optional action to navigate users to specific screens when they tap the notification

3. **Monitor Campaigns**
   - View delivery status and statistics
   - Track sent, delivered, and failed counts
   - Monitor campaign history

### Mobile App Integration ✅ IMPLEMENTED

The mobile app now includes a complete push notification system via the `usePushNotifications` hook.

#### 1. Automatic Setup ✅

The push notification system is automatically initialized in `app/_layout.tsx`:

```typescript
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function RootLayout() {
	// Initialize push notifications automatically
	const { expoPushToken, notification } = usePushNotifications();

	// ... rest of layout
}
```

#### 2. Push Notification Hook ✅

The `mobile/hooks/usePushNotifications.ts` provides:

```typescript
export function usePushNotifications() {
	// Automatic token registration
	// Permission handling
	// Notification listeners
	// Timezone synchronization

	return {
		expoPushToken,
		notification,
	};
}
```

**Features included:**

- ✅ Automatic push token generation and registration
- ✅ Device permission handling
- ✅ Backend token registration with device info
- ✅ Timezone detection and synchronization
- ✅ Real-time notification listening
- ✅ Notification tap handling with deep linking
- ✅ Cross-platform support (iOS/Android)
- ✅ Deep linking to specific app screens

#### 3. Notification Behavior ✅

Configured to:

- Show alerts when notifications arrive
- Play notification sounds
- Show in notification banner and list
- Handle both foreground and background notifications

#### 4. Backend Integration ✅

Automatically:

- Registers push tokens with `/api/push-tokens`
- Updates user timezone via `/api/user/personal-details`
- Handles token refresh and device changes

## Deep Linking

The push notification system supports deep linking to specific screens in the app. When a user taps a notification, the app can automatically navigate to the relevant screen based on the notification's data payload.

### Supported Actions

The following deep linking actions are supported:

- `open_referral_page` - Navigate to the referrals tab
- `open_home` - Navigate to the home tab
- `open_progress` - Navigate to the progress tab
- `open_settings` - Navigate to the settings tab

### Implementation

Deep linking is handled automatically by the `usePushNotifications` hook. When a notification is tapped:

1. The notification data is extracted from the response
2. The `action` field is checked for a valid deep link action
3. The app navigates to the appropriate screen using Expo Router
4. If no action is specified or an unknown action is provided, the app defaults to the home screen

### Adding New Deep Link Actions

To add new deep link actions:

1. **Backend**: Include the action in the notification data payload:

   ```typescript
   data: {
     type: "your_notification_type",
     action: "open_your_page",
     // additional data...
   }
   ```

2. **Mobile**: Add the new action to the switch statement in `usePushNotifications.ts`:
   ```typescript
   case "open_your_page":
     console.log("📱 Navigating to your page");
     router.push("/(tabs)/your-page");
     break;
   ```

### Example Usage

The referral welcome notification includes deep linking:

```typescript
// Backend notification data
data: {
  type: "referral_welcome",
  action: "open_referral_page",
}

// Result: When user taps notification, app navigates to /(tabs)/referrals
```

## API Reference

### Register Push Token

```http
POST /api/push-tokens
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "ExponentPushToken[...]",
  "deviceId": "device-id",
  "platform": "ios"
}
```

### Deactivate Push Token

```http
DELETE /api/push-tokens
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "ExponentPushToken[...]"
}
```

### Update User Timezone

```http
PATCH /api/user/personal-details
Content-Type: application/json
Authorization: Bearer <token>

{
  "timezone": "Europe/Oslo"
}
```

## 🧪 Testing Steps

### Prerequisites ✅

- Backend running with Expo access token configured
- Mobile app built with push notification dependencies
- Physical device (push notifications don't work in simulators)

### 1. Build and Install Development App

```bash
cd mobile
npx expo run:ios --device
# or
npx expo run:android --device
```

### 2. Test Token Registration

1. **Launch the app** on your physical device
2. **Grant notification permissions** when prompted
3. **Check backend logs** - you should see:
   ```
   📱 Push token: ExponentPushToken[...]
   ✅ Token registered with backend
   ✅ Timezone updated: Europe/Oslo
   ```
4. **Verify in database** that the token was stored in `push_tokens` table

### 3. Test Push Notifications via Admin Interface

#### Start Backend:

```bash
cd backend
npm run dev
```

#### Access Admin Interface:

- Go to `http://localhost:3000/admin/push-notifications`
- You should see the push notification form

#### Send Test Notification:

1. **Title**: "Test Notification"
2. **Message**: "Hello from your app!"
3. **Target**: "Send to Everyone Now"
4. **Click**: "Send Push Notification"

#### Check Your Device:

- You should receive the notification within seconds
- Tap the notification to see it opens your app
- Check console logs for notification handling

### 4. Test Different Targeting Options

#### Test User-Specific Notification:

1. Get your user ID from the database
2. In admin interface, select "Send to Specific User"
3. Enter your user ID
4. Send notification

#### Test Local Time Scheduling:

1. Select "Send at Users' Local Time"
2. Set time to current time + 2 minutes
3. Wait and see if notification arrives at scheduled time

### 5. Monitor Campaign Analytics

1. Go to "Campaign History" tab in admin interface
2. Check delivery statistics:
   - **Sent count** should be 1
   - **Delivered count** should update when notification is delivered
   - **Failed count** should be 0

### 6. Test Error Handling

#### Test Invalid Token:

1. Manually add an invalid token to database
2. Send notification to everyone
3. Check that invalid tokens are deactivated

#### Test Network Issues:

1. Turn off device internet
2. Send notification
3. Turn internet back on
4. Check if notification is received

## Best Practices

### For Administrators

1. **Test First**: Always test with a single user before sending to everyone
2. **Timing Matters**: Consider user timezones for better engagement
3. **Keep It Short**: Titles under 50 characters, messages under 150 characters
4. **Avoid Spam**: Don't send too many notifications to prevent opt-outs
5. **Monitor Delivery**: Check campaign statistics to ensure successful delivery

### For Developers

1. **Handle Permissions**: Always check and request notification permissions
2. **Token Management**: Re-register tokens when they change
3. **Error Handling**: Handle failed token registrations gracefully
4. **Timezone Updates**: Update user timezone when it changes
5. **Background Handling**: Ensure notifications work when app is backgrounded

## Troubleshooting

### Common Issues

1. **Tokens Not Registering**

   - Check device permissions
   - Verify Expo configuration
   - Ensure user is authenticated

2. **Notifications Not Delivered**

   - Check token validity
   - Verify Expo access token
   - Monitor campaign status

3. **Timezone Issues**
   - Ensure timezone is properly detected
   - Verify timezone format (IANA timezone names)
   - Check user's timezone setting

### Debug Commands

```bash
# Check campaign status
curl -X GET "http://localhost:3000/api/admin/push-campaigns" \
  -H "Authorization: Bearer <admin-token>"

# Test token registration
curl -X POST "http://localhost:3000/api/push-tokens" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <user-token>" \
  -d '{"token":"ExponentPushToken[test]","platform":"ios"}'
```

## Security Considerations

1. **Admin Access**: Only authenticated admin users can send notifications
2. **Token Validation**: All push tokens are validated before storage
3. **Rate Limiting**: Consider implementing rate limits for notification sending
4. **Data Privacy**: Respect user privacy and notification preferences
5. **Token Cleanup**: Automatically deactivate invalid tokens

## Monitoring and Analytics

The system provides comprehensive tracking:

- **Campaign Statistics**: Sent, delivered, and failed counts
- **Delivery Status**: Real-time tracking of notification delivery
- **Error Logging**: Detailed error messages for failed deliveries
- **User Engagement**: Track which notifications perform best

## Future Enhancements

Potential improvements to consider:

1. **User Preferences**: Allow users to customize notification types
2. **Rich Notifications**: Support for images and action buttons
3. **A/B Testing**: Test different notification content
4. **Segmentation**: Target users based on behavior or demographics
5. **Analytics Integration**: Connect with analytics platforms
