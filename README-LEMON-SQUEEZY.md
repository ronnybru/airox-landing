# Lemon Squeezy Integration Guide

This guide will walk you through setting up the Lemon Squeezy integration for the airox boilerplate to handle membership subscriptions.

## Table of Contents

- [Lemon Squeezy Integration Guide](#lemon-squeezy-integration-guide)
  - [Table of Contents](#table-of-contents)
  - [1. Setting Up Lemon Squeezy Account](#1-setting-up-lemon-squeezy-account)
  - [2. Creating Products and Variants](#2-creating-products-and-variants)
    - [Option A: One Product with Multiple Variants (Recommended)](#option-a-one-product-with-multiple-variants-recommended)
    - [Option B: Separate Products](#option-b-separate-products)
    - [Important Notes on Naming](#important-notes-on-naming)
  - [3. Setting Environment Variables](#3-setting-environment-variables)
  - [4. Syncing Products with Your Application](#4-syncing-products-with-your-application)
  - [5. Setting Up Webhooks](#5-setting-up-webhooks)
  - [6. Setting Up Credit Packages](#6-setting-up-credit-packages)
    - [Creating Credit Package Products](#creating-credit-package-products)
    - [Syncing Credit Packages](#syncing-credit-packages)
    - [Customizing Credit Packages](#customizing-credit-packages)
    - [Serverless Deployment Considerations](#serverless-deployment-considerations)
  - [7. Customizing Membership Tiers](#7-customizing-membership-tiers)
    - [Changing Tier Names](#changing-tier-names)
    - [Changing Pricing and Features](#changing-pricing-and-features)
  - [8. Testing the Integration](#8-testing-the-integration)
    - [Testing Membership Subscriptions](#testing-membership-subscriptions)
    - [Testing Credit Purchases](#testing-credit-purchases)
  - [9. Troubleshooting](#9-troubleshooting)
    - [Webhook Issues](#webhook-issues)
    - [Sync Issues](#sync-issues)
    - [Checkout Issues](#checkout-issues)

## 1. Setting Up Lemon Squeezy Account

1. Sign up for a Lemon Squeezy account at [app.lemonsqueezy.com](https://app.lemonsqueezy.com)
2. Create a store or use an existing one
3. Navigate to Settings → API in the Lemon Squeezy dashboard
4. Generate a new API key with read/write permissions
5. Copy your API key and store ID for later use

## 2. Creating Products and Variants

### Option A: One Product with Multiple Variants (Recommended)

1. Create a new product in Lemon Squeezy (e.g., "airox Membership")
2. Add five variants to this product:
   - **Silver Monthly**: Set up as a subscription with monthly billing
   - **Silver Yearly**: Set up as a subscription with yearly billing (with discount)
   - **Gold Monthly**: Set up as a subscription with monthly billing
   - **Gold Yearly**: Set up as a subscription with yearly billing (with discount)
   - **Lifetime**: Set up as a one-time payment

This approach allows you to offer different pricing for monthly and yearly billing cycles, typically with a discount for yearly subscriptions.

### Option B: Separate Products

1. Create three separate products:
   - **Silver Membership**: With a "Silver" variant
   - **Gold Membership**: With a "Gold" variant
   - **Lifetime Membership**: With a "Lifetime" variant

### Important Notes on Naming

- The **variant names** must match the membership tier names in your config file ("silver_monthly", "silver_yearly", "gold_monthly", "gold_yearly", "lifetime")
- Product names can be anything you prefer
- If you want to use different tier names (e.g., "basic", "pro", "enterprise"), you'll need to update the code (see [Customizing Membership Tiers](#7-customizing-membership-tiers))

## 3. Setting Environment Variables

Add the following variables to your `.env` file:

```
# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
```

- `LEMONSQUEEZY_API_KEY`: The API key you generated in step 1
- `LEMONSQUEEZY_STORE_ID`: Your store ID from Lemon Squeezy
- `LEMONSQUEEZY_WEBHOOK_SECRET`: A secret string you'll create in step 5

## 4. Syncing Products with Your Application

1. Start your development server:

   ```
   npm run dev
   ```

2. Navigate to the admin memberships page:

   ```
   http://localhost:3000/admin/memberships
   ```

3. Click the "Sync with Lemon Squeezy" button to:

   - Sync membership tiers with your Lemon Squeezy products
   - Sync credit packages with your Lemon Squeezy products

4. You should see a success message with the synced plans and credit packages

## 5. Setting Up Webhooks

1. In the Lemon Squeezy dashboard, go to Settings → Webhooks
2. Click "Create a new webhook"
3. Enter your webhook URL:

   - For production: `https://your-domain.com/api/webhook`
   - For development: Use a service like ngrok to expose your local server
     ```
     npx ngrok http 3000
     ```
     Then use the URL: `https://your-ngrok-url.ngrok.io/api/webhook`

4. Generate a signing secret or enter your own (must match `LEMONSQUEEZY_WEBHOOK_SECRET` in your `.env`)
5. Select the following events:

   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_payment_success`
   - `subscription_payment_failed`
   - `subscription_payment_recovered`

6. Save the webhook

## 6. Setting Up Credit Packages

In addition to membership tiers, the application supports credit packages that users can purchase to top up their account credits.

### Creating Credit Package Products

1. In your Lemon Squeezy store, create a new product (e.g., "Credits")
2. Add three variants to this product:
   - **100 Credits**: Set up as a one-time payment
   - **1000 Credits**: Set up as a one-time payment
   - **5000 Credits**: Set up as a one-time payment

**Important**: The variant names must be exactly "100 Credits", "1000 Credits", and "5000 Credits" for the system to recognize them correctly.

### Syncing Credit Packages

The sync process is now combined with membership tier syncing. When you click the "Sync with Lemon Squeezy" button, both membership tiers and credit packages will be synced at the same time.

1. The sync process will look for variants with names matching "100 Credits", "1000 Credits", and "5000 Credits"
   - If a matching variant is found, its ID will be stored in the config file
   - If no matching variant is found, the variantId will remain null

### Customizing Credit Packages

If you want to modify the available credit packages:

1. You can directly edit the `config/payment-processor.json` file:

   ```json
   {
   	"_comment": "This file contains configuration for both credit packages and membership tiers used with Lemon Squeezy integration.",
   	"_creditPackagesInfo": "Credit packages are one-time purchases that add credits to a user's account. Each package has an amount (number of credits), price (in cents), and Lemon Squeezy variant/product IDs that are populated when synced.",
   	"creditPackages": [
   		{
   			"amount": 100,
   			"price": 999,
   			"variantId": 781724,
   			"productId": 502500
   		},
   		{
   			"amount": 1000,
   			"price": 4999,
   			"variantId": 781734,
   			"productId": 502500
   		},
   		{
   			"amount": 5000,
   			"price": 19999,
   			"variantId": 781737,
   			"productId": 502500
   		}
   	],
   	"_membershipTiersInfo": "Membership tiers are subscription plans that users can purchase. Each tier has a name, price (in cents), credits (awarded monthly or one-time for lifetime), and Lemon Squeezy variant/product IDs that are populated when synced.",
   	"_membershipTiersUsage": "To add or modify membership tiers, add entries to this array and run the syncPlans function. The name must be one of: silver_monthly, silver_yearly, gold_monthly, gold_yearly, or lifetime.",
   	"membershipTiers": [
   		{
   			"name": "silver_monthly",
   			"price": 1299,
   			"credits": 100,
   			"lemonSqueezyVariantId": null,
   			"lemonSqueezyProductId": null
   		}
   		// ... other tiers
   	]
   }
   ```

2. Or update the `getCreditPackages` and `getMembershipTiers` functions in `app/actions/membership.ts` to change the default packages.

3. Make sure to create corresponding variants in Lemon Squeezy with names that match the credit amounts (e.g., "100 Credits") and membership tiers (e.g., "Silver Monthly", "Gold Yearly", "Lifetime")

### Serverless Deployment Considerations

The current implementation uses the file system to store both credit package and membership tier information in `config/payment-processor.json`. This works well for traditional hosting environments, but may require modifications for serverless environments:

1. **Read-only File System**: Many serverless environments (like Vercel or AWS Lambda) have read-only file systems except for specific directories like `/tmp`.

2. **Persistence Between Invocations**: Files written to writable directories like `/tmp` may not persist between function invocations.

For serverless deployments, consider these alternatives:

1. **Environment Variables**: Store variant IDs in environment variables instead of a config file.
2. **Database Storage**: Create a simple table to store credit package and membership tier information.

3. **Key-Value Store**: Use a serverless-friendly storage solution like Redis, DynamoDB, or Vercel KV.

4. **Manual Configuration**: Pre-configure the variant IDs during the build process rather than syncing at runtime.

## 7. Customizing Membership Tiers

### Changing Tier Names

If you want to use different tier names (e.g., "basic", "pro", "enterprise"):

1. Update the `config/payment-processor.json` file with your new tier names:

   ```json
   {
   	"membershipTiers": [
   		{
   			"name": "basic_monthly",
   			"price": 1299,
   			"credits": 100,
   			"lemonSqueezyVariantId": null,
   			"lemonSqueezyProductId": null,
   			"active": true,
   			"uiData": {
   				"title": "Basic",
   				"features": [
   					"100 credits per month",
   					"Basic support",
   					"Access to core features"
   				],
   				"badge": "",
   				"color": "bg-gray-200 hover:bg-gray-300"
   			}
   		},
   		{
   			"name": "pro_monthly",
   			"price": 1299,
   			"credits": 300,
   			"lemonSqueezyVariantId": null,
   			"lemonSqueezyProductId": null,
   			"active": true,
   			"uiData": {
   				"title": "Pro",
   				"features": [
   					"300 credits per month",
   					"Priority support",
   					"Access to all features",
   					"Advanced analytics"
   				],
   				"badge": "Popular",
   				"color": "bg-yellow-100 hover:bg-yellow-200"
   			}
   		}
   		// ... other tiers
   	]
   }
   ```

2. Update the `CheckoutTier` type in `app/(protected)/membership/page.tsx`:

   ```typescript
   type CheckoutTier = "basic" | "pro" | "enterprise";
   ```

3. Update the `ConfigMembershipTier` interface in `app/(protected)/membership/page.tsx`:

   ```typescript
   interface ConfigMembershipTier {
   	name:
   		| "basic_monthly"
   		| "basic_yearly"
   		| "pro_monthly"
   		| "pro_yearly"
   		| "enterprise";
   	// ... other properties
   }
   ```

4. Update the tier name check in `app/actions/membership.ts`:

   ```typescript
   const tierName = variant.name.toLowerCase();
   if (tierName.includes("basic")) {
   	baseTier = "basic";
   	billingCycle = tierName.includes("monthly") ? "monthly" : "yearly";
   } else if (tierName.includes("pro")) {
   	baseTier = "pro";
   	billingCycle = tierName.includes("monthly") ? "monthly" : "yearly";
   } else if (tierName === "enterprise") {
   	baseTier = "enterprise";
   }
   ```

5. Update the `MembershipTier` type in `app/actions/membership.ts`:

   ```typescript
   export type MembershipTier = {
   	name:
   		| "basic_monthly"
   		| "basic_yearly"
   		| "pro_monthly"
   		| "pro_yearly"
   		| "enterprise";
   	// ... other properties
   };
   ```

6. Make sure your Lemon Squeezy variant names match these new tier names

### Changing Pricing and Features

1. Update the `membershipTiers` array in the `config/payment-processor.json` file with your desired prices, credits, and UI data:

   ```json
   {
   	"membershipTiers": [
   		{
   			"name": "silver_monthly",
   			"price": 1299, // $12.99 in cents
   			"credits": 100,
   			"lemonSqueezyVariantId": null,
   			"lemonSqueezyProductId": null,
   			"active": true,
   			"uiData": {
   				"title": "Silver",
   				"features": [
   					"100 credits per month",
   					"Basic support",
   					"Access to core features"
   				],
   				"badge": "",
   				"color": "bg-gray-200 hover:bg-gray-300"
   			}
   		}
   		// ... other tiers
   	]
   }
   ```

2. After updating the config file, run the sync process again to ensure the changes are properly applied

## 8. Testing the Integration

### Testing Membership Subscriptions

1. Navigate to your membership page:

   ```
   http://localhost:3000/membership
   ```

2. Sign in with a user account
3. Select a membership tier and click "Get Started"
4. Complete the checkout process on the Lemon Squeezy checkout page
5. Verify that the webhook receives the subscription event
6. Check that the user's membership is updated in the database with the correct membership tier from the config file

### Testing Credit Purchases

1. Navigate to your membership page:

   ```
   http://localhost:3000/membership
   ```

2. Sign in with a user account
3. Scroll down to the "Purchase Credits" section
4. Select a credit package and click "Purchase Now"
5. Complete the checkout process on the Lemon Squeezy checkout page
6. Verify that the webhook receives the order event
7. Check that the user's credits are updated in the database
8. Verify the credits are displayed correctly on the dashboard

## 9. Troubleshooting

### Webhook Issues

- Check that your webhook URL is accessible
- Verify that the webhook secret matches your `.env` file
- Look for webhook delivery failures in the Lemon Squeezy dashboard

### Sync Issues

- Ensure your Lemon Squeezy variant names match your membership tier names
- Check that your API key has the correct permissions
- Verify that your store ID is correct

### Checkout Issues

- Check that the redirect URLs are configured correctly
- Verify that the variant IDs are correctly synced in your config file
- Ensure your Lemon Squeezy store is properly configured

For more information, refer to the [Lemon Squeezy API documentation](https://docs.lemonsqueezy.com/api).
