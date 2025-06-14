# Push Token Management System

This document describes the enhanced push token management system that includes user session validation and logout token cleanup.

## Features

### 1. User Session Validation

Before sending push notifications, the system validates that tokens belong to users with active sessions. This prevents notifications from being sent to users who have logged out or whose sessions have expired.

#### Implementation

- **Function**: `getActivePushTokens()` in `lib/push-notifications.ts`
- **Validation**: Joins push tokens with active sessions using `session.expiresAt > new Date()`
- **Cleanup**: Automatically deactivates tokens for users without active sessions

#### Benefits

- Prevents notifications to logged-out users
- Reduces failed notification attempts
- Improves notification delivery rates
- Maintains data consistency

### 2. Logout Token Cleanup

When a user logs out, all their push tokens are immediately deactivated to prevent future notifications.

#### Implementation

- **API Endpoint**: `POST /api/push-tokens/logout`
- **Function**: `deactivateAllUserTokens(userId)` in `lib/push-notifications.ts`
- **Integration**: Called automatically during logout in `mobile/store/auth.ts`

#### Flow

**Regular Logout:**

1. User initiates logout from settings
2. `deactivatePushTokensOnLogout()` is called
3. API request to `/api/push-tokens/logout`
4. All user tokens are marked as `isActive: false`
5. Regular logout process continues

**Account Deletion:**

1. User initiates account deletion
2. Push tokens are deactivated before session deletion
3. Push tokens are deleted from database
4. Sessions and user data are deleted
5. Mobile logout cleanup is handled gracefully (no errors shown)

### 3. Token Validation Before Sending

Before sending any push notification campaign, the system runs validation and cleanup:

#### Process

1. `validateAndCleanupTokens()` is called
2. Session validation cleanup runs
3. Invalid tokens are deactivated
4. Only valid tokens receive notifications

## API Endpoints

### POST /api/push-tokens/logout

Deactivates all push tokens for the authenticated user.

**Authentication**: Required
**Parameters**: None
**Response**:

```json
{
	"success": true,
	"message": "All push tokens deactivated successfully"
}
```

## Functions

### `deactivateTokensForInactiveSessions()`

Finds and deactivates push tokens for users without active sessions.

**Logic**:

1. Get all active tokens
2. Get users with active sessions
3. Find tokens for users without active sessions
4. Deactivate those tokens

### `deactivateAllUserTokens(userId: string)`

Deactivates all push tokens for a specific user (used during logout).

**Parameters**:

- `userId`: The user ID whose tokens should be deactivated

### `validateAndCleanupTokens()`

Runs comprehensive token validation and cleanup before sending notifications.

**Process**:

1. Session validation cleanup
2. Additional cleanup for consistently failing tokens (extensible)

## Mobile Integration

### Logout Integration

The mobile app automatically calls token cleanup during logout:

```typescript
// In mobile/store/auth.ts
signOut: async () => {
	try {
		// Deactivate push tokens before signing out
		await deactivatePushTokensOnLogout();

		await authClient.signOut();
		// ... rest of logout logic
	} catch (error) {
		console.error("Sign out error:", error);
	}
};
```

### Hook Function

```typescript
// In mobile/hooks/usePushNotifications.ts
export async function deactivatePushTokensOnLogout() {
	try {
		await api.post("/api/push-tokens/logout");
		console.log("✅ Push tokens deactivated on logout");
	} catch (error) {
		console.error("❌ Failed to deactivate push tokens on logout:", error);
	}
}
```

## Database Schema

The push tokens table includes an `isActive` field for token management:

```sql
CREATE TABLE push_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_id TEXT,
  platform VARCHAR(10) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Testing

Use the test script to verify token cleanup functionality:

```bash
npx tsx scripts/test-token-cleanup.ts
```

The script tests:

1. Current active tokens
2. Session validation cleanup
3. Token statistics
4. Active sessions count

## Benefits

1. **Security**: Prevents notifications to logged-out users
2. **Performance**: Reduces failed notification attempts
3. **User Experience**: No unwanted notifications after logout
4. **Data Integrity**: Maintains consistent token state
5. **Cost Efficiency**: Reduces unnecessary API calls to push services

## Error Handling

- All token operations include proper error handling
- Failed cleanup operations are logged but don't block the main flow
- Logout continues even if token cleanup fails
- Session validation runs independently and doesn't affect notification sending if it fails
- Account deletion includes push token deletion before session deletion
- Mobile app handles authentication errors gracefully during logout/deletion
- No error messages are shown to users for token cleanup failures

## Future Enhancements

1. **Token Rotation**: Implement automatic token refresh
2. **Delivery Tracking**: Track failed deliveries and auto-deactivate problematic tokens
3. **Device Management**: Allow users to manage their registered devices
4. **Analytics**: Track token lifecycle and cleanup statistics
