# Webhook Production Checklist

This document outlines the critical fixes applied to resolve webhook and subscription activation issues.

## Issues Fixed

### 1. Google Play API Authentication (401 Errors)

**Problem**: The Google Play API was returning 401 errors due to improper JWT signing.

**Solution**:

- Fixed JWT signing in both webhook and IAP validation routes
- Properly implemented RSA256 signing with service account private key
- Added proper error handling for OAuth failures

### 2. Mock Validation in Production

**Problem**: The system was using mock validation tokens instead of real Google Play API validation.

**Solution**:

- Removed all mock validation logic from production code
- Implemented proper Google Play API validation with real service account credentials
- Added fallback error handling without mock responses

### 3. User Activation Timing

**Problem**: Users were not being activated after their trial period (3 minutes for testing, 3 days for production).

**Solution**:

- Enhanced webhook logic to check trial period timing
- Added cron job (`/api/cron/activate-trial-users`) that runs every 5 minutes
- Improved user lookup by purchase token with fuzzy matching

### 4. Purchase Token Lookup Issues

**Problem**: Webhooks couldn't find users by purchase token due to token format differences.

**Solution**:

- Improved `findUserByPurchaseToken` function with partial matching
- Added fallback logic to find users with similar purchase tokens
- Enhanced logging for debugging user lookup issues

## Environment Variables Required

Ensure these environment variables are properly configured:

```bash
# Google Play IAP
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
GOOGLE_WEBHOOK_SECRET="your-google-webhook-secret"

# Cron Jobs
CRON_SECRET="your-cron-secret"

# Other required variables
DATABASE_URL="your-database-url"
BETTER_AUTH_SECRET="your-auth-secret"
```

## Google Service Account Setup

1. **Create Service Account**:

   - Go to Google Cloud Console
   - Navigate to IAM & Admin > Service Accounts
   - Create a new service account with Google Play Developer API access

2. **Generate Private Key**:

   - Download the JSON key file
   - Set the entire JSON content as `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable

3. **Enable APIs**:
   - Enable Google Play Developer API
   - Enable Google Play Android Developer API

## Webhook Configuration

### Google Play Console Setup

1. Go to Google Play Console > Monetization > Subscriptions
2. Configure Real-time developer notifications
3. Set webhook URL: `https://your-domain.com/api/webhooks/google`
4. Use the `GOOGLE_WEBHOOK_SECRET` for verification

### Pub/Sub Topic Setup

1. Create a Pub/Sub topic in Google Cloud Console
2. Create a subscription pointing to your webhook URL
3. Configure proper IAM permissions

## Cron Job Setup

The new cron job `/api/cron/activate-trial-users` ensures users are activated even if webhooks fail:

- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Function**: Activates trial users whose trial period has ended
- **Fallback**: Provides redundancy if webhooks fail

### Manual Cron Trigger (for testing)

```bash
curl -X GET "https://your-domain.com/api/cron/activate-trial-users" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Testing Checklist

### 1. Webhook Testing

- [ ] Verify Google Play webhook receives notifications
- [ ] Check that 401 errors are resolved
- [ ] Confirm users are found by purchase token
- [ ] Validate subscription activation timing

### 2. IAP Validation Testing

- [ ] Test real Google Play purchases (not mock)
- [ ] Verify JWT signing works correctly
- [ ] Check subscription status updates

### 3. Cron Job Testing

- [ ] Manually trigger cron job
- [ ] Verify trial users are activated
- [ ] Check logging output

## Monitoring and Logging

### Key Log Messages to Monitor

**Success Messages**:

```
✅ Google webhook: Activated subscription for user email@example.com
✅ Activated trial user: email@example.com, plan: premium_yearly
✅ IAP validation successful for user email@example.com
```

**Error Messages to Watch**:

```
❌ Google Play API error: 401
❌ No user found for purchase token
❌ Failed to handle subscription purchase
```

### Recommended Monitoring

1. Set up alerts for 401 errors from Google Play API
2. Monitor cron job execution logs
3. Track subscription activation rates
4. Alert on webhook processing failures

## Production Deployment Steps

1. **Update Environment Variables**:

   ```bash
   # Set production Google service account
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

   # Set production webhook secret
   GOOGLE_WEBHOOK_SECRET="production-webhook-secret"

   # Set cron secret
   CRON_SECRET="production-cron-secret"
   ```

2. **Deploy Updated Code**:

   - Deploy webhook fixes
   - Deploy IAP validation fixes
   - Deploy new cron job

3. **Configure Cron Jobs**:

   - Ensure cron server is running
   - Verify cron job is scheduled correctly
   - Test manual execution

4. **Test End-to-End**:
   - Make test purchase
   - Verify webhook receives notification
   - Check user activation after trial period
   - Confirm cron job backup works

## Troubleshooting

### Common Issues

**401 Errors from Google Play API**:

- Check service account JSON format
- Verify API permissions
- Ensure private key is correctly formatted

**Users Not Activating**:

- Check cron job logs
- Verify trial period calculation
- Check user lookup logic

**Webhook Not Receiving Notifications**:

- Verify Pub/Sub configuration
- Check webhook URL accessibility
- Validate webhook secret

### Debug Commands

```bash
# Check cron job status
curl -X GET "https://your-domain.com/api/cron/activate-trial-users" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Check webhook endpoint
curl -X POST "https://your-domain.com/api/webhooks/google" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## Security Considerations

1. **Webhook Security**:

   - Use HTTPS only
   - Validate webhook signatures
   - Rate limit webhook endpoints

2. **Service Account Security**:

   - Rotate service account keys regularly
   - Use least privilege access
   - Monitor API usage

3. **Cron Job Security**:
   - Use strong cron secrets
   - Limit cron job access
   - Monitor execution logs

## Performance Optimization

1. **Webhook Performance**:

   - Process webhooks asynchronously
   - Implement retry logic
   - Use database connection pooling

2. **Cron Job Performance**:
   - Process users in batches
   - Implement proper error handling
   - Add execution time monitoring

This checklist ensures a robust, production-ready subscription system with proper webhook handling and user activation.
