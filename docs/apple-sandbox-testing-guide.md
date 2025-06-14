# Apple Sandbox Testing Guide

This guide explains how to test subscription webhooks in Apple's sandbox environment with accelerated timing.

## Apple Sandbox Accelerated Timeline

Apple automatically speeds up subscription timing in sandbox for testing:

### Trial Periods

- **Production**: 3 days free trial
- **Sandbox**: 3 minutes free trial

### Subscription Durations

- **1 week subscription** → 3 minutes in sandbox
- **1 month subscription** → 5 minutes in sandbox
- **2 months subscription** → 10 minutes in sandbox
- **3 months subscription** → 15 minutes in sandbox
- **6 months subscription** → 30 minutes in sandbox
- **1 year subscription** → 1 hour in sandbox

### Renewal Cycles

- **Monthly renewals** → Every 5 minutes in sandbox
- **Yearly renewals** → Every hour in sandbox
- **Maximum 6 renewals** per subscription in sandbox

## Testing Webhook Events

### 1. Test Subscription Purchase (After Trial)

```bash
# Timeline in sandbox:
# 1. User subscribes → Status: "trial"
# 2. Wait 3 minutes → Apple sends SUBSCRIBED webhook
# 3. User activated → Status: "active"
```

### 2. Test Subscription Renewal

```bash
# Timeline for monthly subscription:
# 1. User active → Status: "active"
# 2. Wait 5 minutes → Apple sends DID_RENEW webhook
# 3. Subscription extended → New expiration date
```

### 3. Test Subscription Cancellation

```bash
# Method 1: Cancel via Settings app
# 1. Go to Settings > Apple ID > Subscriptions
# 2. Find your app subscription
# 3. Tap "Cancel Subscription"
# 4. Apple sends CANCEL webhook immediately

# Method 2: Cancel via App Store Connect
# 1. Go to App Store Connect > TestFlight
# 2. Find the sandbox user
# 3. Cancel their subscription
# 4. Apple sends CANCEL webhook
```

### 4. Test Subscription Expiration

```bash
# Timeline:
# 1. User cancels subscription → Status: "cancelled"
# 2. Wait until expiration time → Apple sends EXPIRED webhook
# 3. User expired → Status: "expired"
```

### 5. Test Payment Failure

```bash
# Method: Use special sandbox test cards
# 1. Use declined test card in sandbox
# 2. Apple sends DID_FAIL_TO_RENEW webhook
# 3. Subscription enters grace period
```

## Sandbox Test Account Setup

### 1. Create Sandbox Test Users

```bash
# In App Store Connect:
# 1. Go to Users and Access > Sandbox Testers
# 2. Click "+" to add new tester
# 3. Use unique email (doesn't need to be real)
# 4. Set country/region for testing
```

### 2. Configure Test Device

```bash
# On iOS device:
# 1. Settings > App Store > Sandbox Account
# 2. Sign out of production Apple ID
# 3. Sign in with sandbox test account
# 4. Install app via TestFlight or Xcode
```

## Webhook Testing Checklist

### ✅ Setup Verification

- [ ] Webhook URL configured in App Store Connect
- [ ] Sandbox test account created and signed in
- [ ] App installed via TestFlight
- [ ] Backend webhook endpoint accessible

### ✅ Test Scenarios

**Trial to Active:**

- [ ] Subscribe to premium → Status: "trial"
- [ ] Wait 3 minutes → Check for SUBSCRIBED webhook
- [ ] Verify user status → Should be "active"

**Renewal Testing:**

- [ ] Wait 5 minutes after activation
- [ ] Check for DID_RENEW webhook
- [ ] Verify subscription end date extended

**Cancellation Testing:**

- [ ] Cancel via Settings app
- [ ] Check for CANCEL webhook immediately
- [ ] Verify user status → Should be "cancelled"

**Expiration Testing:**

- [ ] Wait until subscription expires
- [ ] Check for EXPIRED webhook
- [ ] Verify user status → Should be "expired"

## Webhook Monitoring

### Check Webhook Logs

```bash
# Monitor your backend logs for:
✅ "Apple webhook received: SUBSCRIBED"
✅ "Apple webhook: Activated subscription for user"
✅ "Apple webhook received: DID_RENEW"
✅ "Apple webhook received: CANCEL"
✅ "Apple webhook: Cancelled subscription for user"
```

### Debug Webhook Issues

```bash
# Common issues:
❌ Webhook URL not reachable → Check HTTPS and firewall
❌ JWT decode errors → Check Apple's JWT format
❌ User not found → Check transaction ID matching
❌ Database update fails → Check user permissions
```

## Manual Testing Commands

### Test Webhook Endpoint

```bash
# Test if webhook endpoint is reachable:
curl -X POST "https://your-domain.com/api/webhooks/apple" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Check User Status

```bash
# Query database to verify user status:
SELECT email, subscriptionStatus, subscriptionEndDate
FROM user
WHERE email = 'test@example.com';
```

## Troubleshooting

### Webhook Not Received

1. **Check App Store Connect webhook URL**
2. **Verify HTTPS certificate is valid**
3. **Check firewall/security groups**
4. **Monitor server logs for incoming requests**

### User Not Activated

1. **Check webhook logs for SUBSCRIBED event**
2. **Verify transaction ID matching logic**
3. **Check database user lookup**
4. **Verify subscription status update**

### Timing Issues

1. **Remember sandbox uses accelerated timing**
2. **Trial period is 3 minutes, not 3 days**
3. **Renewals happen every 5 minutes for monthly**
4. **Maximum 6 renewals per subscription**

## Production vs Sandbox

| Feature         | Production | Sandbox    |
| --------------- | ---------- | ---------- |
| Trial Period    | 3 days     | 3 minutes  |
| Monthly Renewal | 30 days    | 5 minutes  |
| Yearly Renewal  | 365 days   | 1 hour     |
| Max Renewals    | Unlimited  | 6 renewals |
| Real Payments   | Yes        | No         |
| Webhook Timing  | Real-time  | Real-time  |

This accelerated timeline makes it easy to test the complete subscription lifecycle in just a few minutes!
