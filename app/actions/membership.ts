"use server";

import {
	createCheckout,
	listProducts,
	getProduct,
	listPrices,
	cancelSubscription,
	getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import { format } from "date-fns";
import {
	sendSubscriptionCreatedEmail,
	sendSubscriptionCancelledEmail,
} from "@/app/emails/subscription-emails";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { db } from "@/lib/db";
import {
	organizationMemberships,
	organization,
	user,
	member,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getServerSession, getActiveOrganization } from "@/lib/session";

// Define types for plans
export type NewPlan = {
	name: string;
	description: string;
	price: string;
	interval?: string;
	intervalCount?: number;
	isUsageBased?: boolean;
	productId: number;
	productName: string;
	variantId: number;
	trialInterval?: string;
	trialIntervalCount?: number;
	sort?: number;
};

// Define types for credit packages
export type CreditPackage = {
	amount: number;
	price: number; // in cents
	variantId?: number | null;
	productId?: number | null;
};

// Helper function to read config file
async function readConfigFile() {
	try {
		// Import the fs and path modules dynamically
		const { promises: fs } = await import("fs");
		const path = await import("path");
		const configPath = path.join(
			process.cwd(),
			"config",
			"payment-processor.json"
		);

		// Read the file
		const data = await fs.readFile(configPath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		console.error("Error reading payment processor config:", error);
		return null;
	}
}

// Helper function to write config file
async function writeConfigFile(config: Record<string, unknown>) {
	try {
		// Import the fs and path modules dynamically
		const { promises: fs } = await import("fs");
		const path = await import("path");
		const configPath = path.join(
			process.cwd(),
			"config",
			"payment-processor.json"
		);

		await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

		return true;
	} catch (error) {
		console.error("Error writing payment processor config:", error);
		return false;
	}
}

// Define types for membership tiers
export type MembershipTier = {
	name:
		| "silver_monthly"
		| "silver_yearly"
		| "gold_monthly"
		| "gold_yearly"
		| "lifetime";
	price: number; // in cents
	credits: number;
	lemonSqueezyVariantId?: number | null;
	lemonSqueezyProductId?: number | null;
};

// Available credit packages - read from config file
export async function getCreditPackages(): Promise<CreditPackage[]> {
	const config = await readConfigFile();

	if (config && config.creditPackages) {
		return config.creditPackages;
	}

	// Fallback to default values if the file can't be read or doesn't have creditPackages
	return [
		{
			amount: 100,
			price: 999, // $9.99
			variantId: null,
			productId: null,
		},
		{
			amount: 1000,
			price: 1299, // $12.99
			variantId: null,
			productId: null,
		},
		{
			amount: 5000,
			price: 19999, // $199.99
			variantId: null,
			productId: null,
		},
	];
}

// Available membership tiers - read from config file
export async function getMembershipTiers(): Promise<MembershipTier[]> {
	const config = await readConfigFile();

	if (config && config.membershipTiers) {
		return config.membershipTiers;
	}

	// If no membership tiers in config, throw an error
	throw new Error("No membership tiers found in config file");
}

/**
 * Syncs plans from Lemon Squeezy to the config file
 */
export async function syncPlans() {
	configureLemonSqueezy();

	// Initialize memberships in the database if they don't exist (for backward compatibility)
	await initializeMemberships();

	// Fetch all the variants from the database.
	const productVariants: NewPlan[] = [];

	// Helper function to add a variant to the productVariants array and sync it with the config file.
	async function _addVariant(variant: NewPlan) {
		console.log(`Syncing variant ${variant.name}...`);

		// Map Lemon Squeezy variant to our membership tier
		const tierName = variant.name.toLowerCase();
		// Extract the base tier name and billing cycle from the variant name
		// Format expected: "Silver Monthly", "Gold Yearly", "Lifetime", etc.
		let baseTier = "";
		let billingCycle = "";

		if (tierName.includes("silver")) {
			baseTier = "silver";
			billingCycle = tierName.includes("monthly") ? "monthly" : "yearly";
		} else if (tierName.includes("gold")) {
			baseTier = "gold";
			billingCycle = tierName.includes("monthly") ? "monthly" : "yearly";
		} else if (tierName === "lifetime") {
			baseTier = "lifetime";
		}

		// Skip if we couldn't map the variant to a tier
		if (baseTier) {
			// For lifetime, use as is; for others, combine with billing cycle
			const dbTierName =
				baseTier === "lifetime"
					? "lifetime"
					: (`${baseTier}_${billingCycle}` as
							| "silver_monthly"
							| "silver_yearly"
							| "gold_monthly"
							| "gold_yearly"
							| "lifetime");

			// We now use the config file instead of the database for memberships

			// Update the config file
			try {
				const config = (await readConfigFile()) || {};
				if (!config.membershipTiers) {
					// Initialize membership tiers if they don't exist
					await initializeMemberships();
					// Re-read the config
					const newConfig = await readConfigFile();
					if (!newConfig || !newConfig.membershipTiers) {
						throw new Error(
							"Failed to initialize membership tiers in config file"
						);
					}
					config.membershipTiers = newConfig.membershipTiers;
				}

				// Find and update the membership tier in the config
				const tierIndex = config.membershipTiers.findIndex(
					(tier: MembershipTier) => tier.name === dbTierName
				);

				if (tierIndex !== -1) {
					// Only update the Lemon Squeezy IDs, preserving all other custom data
					config.membershipTiers[tierIndex] = {
						...config.membershipTiers[tierIndex],
						lemonSqueezyVariantId: variant.variantId,
						lemonSqueezyProductId: variant.productId,
					};

					await writeConfigFile(config);
					console.log(
						`Updated ${dbTierName} in config file with variant ID ${variant.variantId}`
					);
				}
			} catch (error) {
				console.error(`Error updating ${dbTierName} in config file:`, error);
			}
		}

		console.log(`${variant.name} synced...`);
		productVariants.push(variant);
	}

	// Fetch products from the Lemon Squeezy store.
	const products = await listProducts({
		filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
		include: ["variants"],
	});

	// Loop through all the variants.
	interface VariantData {
		id: string;
		attributes: {
			status: string;
			product_id: number;
			name: string;
			description: string;
			sort: number;
		};
	}

	const allVariants = products.data?.included as VariantData[] | undefined;

	// for...of supports asynchronous operations, unlike forEach.
	if (allVariants) {
		for (const v of allVariants) {
			const variant = v.attributes;

			// Skip draft variants or if there's more than one variant, skip the default
			// variant. See https://docs.lemonsqueezy.com/api/variants
			if (
				variant.status === "draft" ||
				(allVariants.length !== 1 && variant.status === "pending")
			) {
				continue;
			}

			// Fetch the Product name.
			const productName =
				(await getProduct(variant.product_id)).data?.data.attributes.name ?? "";

			// Fetch the Price object.
			const variantPriceObject = await listPrices({
				filter: {
					variantId: v.id,
				},
			});

			const currentPriceObj = variantPriceObject.data?.data.at(0);
			const isUsageBased =
				currentPriceObj?.attributes.usage_aggregation !== null;
			const interval =
				currentPriceObj?.attributes.renewal_interval_unit || undefined;
			const intervalCount =
				currentPriceObj?.attributes.renewal_interval_quantity || undefined;
			const trialInterval =
				currentPriceObj?.attributes.trial_interval_unit || undefined;
			const trialIntervalCount =
				currentPriceObj?.attributes.trial_interval_quantity || undefined;

			const price = isUsageBased
				? currentPriceObj?.attributes.unit_price_decimal
				: currentPriceObj?.attributes.unit_price;

			const priceString = price !== null ? price?.toString() ?? "" : "";

			// We want both subscriptions and one-time payments (lifetime)

			// For our use case, we want both subscriptions and one-time payments (lifetime)
			await _addVariant({
				name: variant.name,
				description: variant.description,
				price: priceString,
				interval,
				intervalCount,
				isUsageBased,
				productId: variant.product_id,
				productName,
				variantId: parseInt(v.id),
				trialInterval,
				trialIntervalCount,
				sort: variant.sort,
			});
		}
	}

	return productVariants;
}

/**
 * Initialize the membership tiers in the database
 * This function is kept for backward compatibility but will be removed in the future
 * as we transition to using the config file instead of the database
 */
async function initializeMemberships() {
	// Define the membership tiers with monthly and yearly options
	const membershipTiers = [
		{
			name: "silver_monthly" as const,
			price: 3990, // $39.90 in cents
			credits: 100,
			updatedAt: new Date(),
		},
		{
			name: "silver_yearly" as const,
			price: 16728, // $167.28 in cents (30% discount on monthly price * 12)
			credits: 100,
			updatedAt: new Date(),
		},
		{
			name: "gold_monthly" as const,
			price: 4990, // $49.90 in cents
			credits: 300,
			updatedAt: new Date(),
		},
		{
			name: "gold_yearly" as const,
			price: 41916, // $419.16 in cents (30% discount on monthly price * 12)
			credits: 300,
			updatedAt: new Date(),
		},
		{
			name: "lifetime" as const,
			price: 29990, // $299.90 in cents
			credits: 1000,
			updatedAt: new Date(),
		},
	];

	// We now use the config file instead of the database for memberships

	// Also update the config file with the membership tiers
	try {
		const config = (await readConfigFile()) || {};

		// If membershipTiers already exists in config, preserve custom data
		if (config.membershipTiers && Array.isArray(config.membershipTiers)) {
			// Update existing tiers or add new ones
			membershipTiers.forEach((tier) => {
				const existingTierIndex = config.membershipTiers.findIndex(
					(configTier: MembershipTier) => configTier.name === tier.name
				);

				if (existingTierIndex !== -1) {
					// Update only the basic properties, preserving custom data
					config.membershipTiers[existingTierIndex] = {
						...config.membershipTiers[existingTierIndex],
						price: tier.price,
						credits: tier.credits,
					};
				} else {
					// Add new tier
					config.membershipTiers.push({
						name: tier.name,
						price: tier.price,
						credits: tier.credits,
						lemonSqueezyVariantId: null,
						lemonSqueezyProductId: null,
					});
				}
			});
		} else {
			// Initialize membership tiers if they don't exist
			config.membershipTiers = membershipTiers.map((tier) => ({
				name: tier.name,
				price: tier.price,
				credits: tier.credits,
				lemonSqueezyVariantId: null,
				lemonSqueezyProductId: null,
			}));
		}

		await writeConfigFile(config);
		console.log("Updated membership tiers in config file");
	} catch (error) {
		console.error("Error updating membership tiers in config file:", error);
	}
}

/**
 * Creates a checkout URL for a membership tier
 */
export async function getCheckoutURL(
	membershipName: string,
	billingCycle: "monthly" | "yearly" = "monthly",
	embed = false // Default to direct checkout URL instead of embedded modal
) {
	configureLemonSqueezy();

	const session = await getServerSession();
	const activeOrg = await getActiveOrganization();

	if (!session?.user) {
		throw new Error("User is not authenticated.");
	}

	if (!activeOrg) {
		throw new Error("No active organization found.");
	}

	// Get the membership tier
	const baseTier = membershipName as "silver" | "gold" | "lifetime";

	// For lifetime, ignore billing cycle
	const dbTierName =
		baseTier === "lifetime"
			? "lifetime"
			: (`${baseTier}_${billingCycle}` as
					| "silver_monthly"
					| "silver_yearly"
					| "gold_monthly"
					| "gold_yearly"
					| "lifetime");

	// Try to get the membership tier from the config file first
	const membershipTiers = await getMembershipTiers();
	const membership = membershipTiers.find((tier) => tier.name === dbTierName);

	// Get the variant ID from the membership tier
	const variantId = membership?.lemonSqueezyVariantId;

	if (!membership || !variantId) {
		throw new Error(
			`Membership tier ${dbTierName} not found or has no variant ID.`
		);
	}

	if (!variantId) {
		throw new Error(
			`No Lemon Squeezy variant ID found for ${dbTierName} tier.`
		);
	}

	try {
		// Make sure the store ID and variant ID are valid
		if (!process.env.LEMONSQUEEZY_STORE_ID) {
			throw new Error(
				"LEMONSQUEEZY_STORE_ID is not defined in environment variables"
			);
		}

		// Convert variantId to number if it's not already
		const numericVariantId =
			typeof variantId === "string" ? parseInt(variantId, 10) : variantId;

		// Create checkout with minimal required parameters
		const checkout = await createCheckout(
			process.env.LEMONSQUEEZY_STORE_ID,
			numericVariantId,
			{
				checkoutOptions: {
					embed,
					media: false,
					logo: !embed,
				},
				checkoutData: {
					email: session.user.email ?? undefined,
					custom: {
						user_id: session.user.id,
						organization_id: activeOrg.id,
						membership_name: membershipName,
						billing_cycle: billingCycle,
					},
				},
				productOptions: {
					enabledVariants: [numericVariantId], // Only show the selected variant
					redirectUrl: `${
						process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
					}/dashboard/`,
					receiptButtonText: "Go to Dashboard",
					receiptThankYouNote: "Thank you for signing up to airox!",
				},
			}
		);

		// If we have an error property in the response, throw it
		if (checkout.error) {
			console.error("Lemon Squeezy API error:", checkout.error);
			throw new Error(`Lemon Squeezy API error: ${checkout.error.message}`);
		}

		// Check if checkout.data and checkout.data.data exist before accessing attributes
		if (!checkout.data || !checkout.data.data) {
			console.error("Invalid checkout response:", checkout);
			throw new Error("Failed to create checkout: Missing data in response");
		}

		// Check if we have a URL in the response
		if (!checkout.data.data.attributes.url) {
			console.error("Missing URL in checkout response:", checkout);
			throw new Error("Failed to create checkout: Missing URL in response");
		}

		return checkout.data.data.attributes.url;
	} catch (error) {
		console.error("Error creating checkout:", error);

		// If it's a Lemon Squeezy error, extract the details
		if (error instanceof Error && error.name === "Lemon Squeezy Error") {
			// Try to extract more details from the error
			interface LemonSqueezyErrorDetail {
				title: string;
				detail: string;
			}

			const errorCause = (
				error as Error & { cause?: LemonSqueezyErrorDetail[] }
			).cause;
			if (errorCause && Array.isArray(errorCause)) {
				const errorDetails = errorCause
					.map((err) => `${err.title}: ${err.detail}`)
					.join("; ");
				throw new Error(`Failed to create checkout: ${errorDetails}`);
			}
		}

		throw new Error(
			`Failed to create checkout: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Get the current organization's membership
 */
export async function getOrganizationMembership() {
	const activeOrg = await getActiveOrganization();

	if (!activeOrg) {
		return null;
	}

	// Get the organization membership from the database
	const orgMembership = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.organizationId, activeOrg.id));

	if (orgMembership.length === 0) {
		return null;
	}

	// Get the full membership tier data from the config file
	const config = await readConfigFile();
	const configMembershipTiers = config?.membershipTiers || [];

	// Find the membership tier in the config
	const membershipId = orgMembership[0].membershipId;
	const configMembershipTier = configMembershipTiers.find(
		(tier: MembershipTier) => tier.name === membershipId
	);

	if (!configMembershipTier) {
		console.error(`Membership tier ${membershipId} not found in config`);
		return null;
	}

	// Combine the organization membership with the membership tier data
	return {
		organizationMembership: orgMembership[0],
		membership: configMembershipTier,
	};
}

/**
 * Cancel an organization's subscription
 */
export async function cancelOrganizationSubscription() {
	configureLemonSqueezy();

	const activeOrg = await getActiveOrganization();

	if (!activeOrg) {
		throw new Error("No active organization found.");
	}

	const orgMembership = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.organizationId, activeOrg.id));

	if (orgMembership.length === 0) {
		throw new Error("No subscription found for this organization.");
	}

	const subscriptionId = orgMembership[0].lemonSqueezySubscriptionId;

	if (!subscriptionId) {
		throw new Error(
			"No Lemon Squeezy subscription ID found for this organization."
		);
	}

	const cancelledSub = await cancelSubscription(subscriptionId);

	if (cancelledSub.error) {
		throw new Error(cancelledSub.error.message);
	}

	// Update the organization membership in the database
	await db
		.update(organizationMemberships)
		.set({
			status: "cancelled",
			endDate: cancelledSub.data?.data.attributes.ends_at
				? new Date(cancelledSub.data.data.attributes.ends_at)
				: null,
			updatedAt: new Date(),
		})
		.where(eq(organizationMemberships.organizationId, activeOrg.id));

	revalidatePath("/dashboard");

	return cancelledSub;
}

/**
 * Creates a checkout URL for credit purchase
 */
export async function getCreditCheckoutURL(
	creditAmount: number,
	embed = false // Default to direct checkout URL instead of embedded modal
) {
	configureLemonSqueezy();

	const session = await getServerSession();
	const activeOrg = await getActiveOrganization();

	if (!session?.user) {
		throw new Error("User is not authenticated.");
	}

	if (!activeOrg) {
		throw new Error("No active organization found.");
	}

	// Get the credit package
	const creditPackages = await getCreditPackages();
	const creditPackage = creditPackages.find(
		(pkg) => pkg.amount === creditAmount
	);

	if (!creditPackage) {
		throw new Error(`Credit package for ${creditAmount} credits not found.`);
	}

	// If the variant ID is not set, we need to create a checkout with a custom price
	// This is useful during development before syncing with Lemon Squeezy
	const variantId = creditPackage.variantId;

	if (!variantId) {
		throw new Error(
			`No Lemon Squeezy variant ID found for ${creditAmount} credits package. Please sync credit packages first.`
		);
	}

	try {
		// Make sure the store ID and variant ID are valid
		if (!process.env.LEMONSQUEEZY_STORE_ID) {
			throw new Error(
				"LEMONSQUEEZY_STORE_ID is not defined in environment variables"
			);
		}

		// Convert variantId to number if it's not already
		const numericVariantId =
			typeof variantId === "string" ? parseInt(variantId, 10) : variantId;

		// Create checkout with minimal required parameters
		const checkout = await createCheckout(
			process.env.LEMONSQUEEZY_STORE_ID,
			numericVariantId,
			{
				checkoutOptions: {
					embed,
					media: false,
					logo: !embed,
				},
				checkoutData: {
					email: session.user.email ?? undefined,
					custom: {
						user_id: session.user.id,
						organization_id: activeOrg.id,
						credit_amount: creditAmount.toString(),
						is_credit_purchase: "true",
					},
				},
				productOptions: {
					enabledVariants: [numericVariantId], // Only show the selected variant
					redirectUrl: `${
						process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
					}/dashboard/`,
					receiptButtonText: "Go to Dashboard",
					receiptThankYouNote: `Thank you for purchasing ${creditAmount} credits!`,
				},
			}
		);

		// If we have an error property in the response, throw it
		if (checkout.error) {
			console.error("Lemon Squeezy API error:", checkout.error);
			throw new Error(`Lemon Squeezy API error: ${checkout.error.message}`);
		}

		// Check if checkout.data and checkout.data.data exist before accessing attributes
		if (!checkout.data || !checkout.data.data) {
			console.error("Invalid checkout response:", checkout);
			throw new Error("Failed to create checkout: Missing data in response");
		}

		// Check if we have a URL in the response
		if (!checkout.data.data.attributes.url) {
			console.error("Missing URL in checkout response:", checkout);
			throw new Error("Failed to create checkout: Missing URL in response");
		}

		return checkout.data.data.attributes.url;
	} catch (error) {
		console.error("Error creating checkout:", error);

		// If it's a Lemon Squeezy error, extract the details
		if (error instanceof Error && error.name === "Lemon Squeezy Error") {
			// Try to extract more details from the error
			interface LemonSqueezyErrorDetail {
				title: string;
				detail: string;
			}

			const errorCause = (
				error as Error & { cause?: LemonSqueezyErrorDetail[] }
			).cause;
			if (errorCause && Array.isArray(errorCause)) {
				const errorDetails = errorCause
					.map((err) => `${err.title}: ${err.detail}`)
					.join("; ");
				throw new Error(`Failed to create checkout: ${errorDetails}`);
			}
		}

		throw new Error(
			`Failed to create checkout: ${
				error instanceof Error ? error.message : "Unknown error"
			}`
		);
	}
}

/**
 * Sync credit packages with Lemon Squeezy
 */
export async function syncCreditPackages() {
	configureLemonSqueezy();

	// Fetch products from the Lemon Squeezy store
	const products = await listProducts({
		filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
		include: ["variants"],
	});

	// Get our credit packages
	const creditPackages = await getCreditPackages();
	const updatedPackages: CreditPackage[] = [...creditPackages];

	// Loop through all the variants
	interface VariantData {
		id: string;
		attributes: {
			status: string;
			product_id: number;
			name: string;
			description: string;
			sort: number;
		};
	}

	const allVariants = products.data?.included as VariantData[] | undefined;

	if (allVariants) {
		for (const v of allVariants) {
			const variant = v.attributes;

			// Skip draft variants
			if (variant.status === "draft") {
				continue;
			}

			// Check if this is a credit package variant
			// The name should be in the format "100 Credits", "1000 Credits", etc.
			const match = variant.name.match(/^(\d+)\s+Credits$/i);
			if (match) {
				const amount = parseInt(match[1], 10);

				// Find the matching credit package
				const packageIndex = updatedPackages.findIndex(
					(pkg) => pkg.amount === amount
				);
				if (packageIndex !== -1) {
					// Update the variant ID
					updatedPackages[packageIndex] = {
						...updatedPackages[packageIndex],
						variantId: parseInt(v.id),
						productId: variant.product_id,
					};

					console.log(
						`Synced credit package: ${amount} credits with variant ID ${v.id}`
					);
				}
			}
		}
	}

	// Save the updated packages to the config file
	try {
		// Read the current config file
		const config = (await readConfigFile()) || {};

		// If we have existing credit packages, preserve any custom data
		if (config.creditPackages && Array.isArray(config.creditPackages)) {
			// For each updated package, find the corresponding existing package
			// and only update the Lemon Squeezy IDs
			updatedPackages.forEach((updatedPkg, index) => {
				const existingPkg = config.creditPackages.find(
					(pkg: CreditPackage) => pkg.amount === updatedPkg.amount
				);

				if (existingPkg) {
					// Preserve all existing properties and only update the IDs
					updatedPackages[index] = {
						...existingPkg,
						variantId: updatedPkg.variantId,
						productId: updatedPkg.productId,
					};
				}
			});
		}

		// Update the credit packages
		config.creditPackages = updatedPackages;

		// Write the updated config back to the file
		await writeConfigFile(config);

		console.log("Credit packages saved to config file");
	} catch (error) {
		console.error("Error saving credit packages to config file:", error);
	}

	return updatedPackages;
}

/**
 * Sync all Lemon Squeezy products (both membership tiers and credit packages)
 */
export async function syncAllProducts() {
	configureLemonSqueezy();

	// Initialize memberships in the database if they don't exist (for backward compatibility)
	await initializeMemberships();

	// Sync membership plans
	const plans = await syncPlans();

	// Sync credit packages
	const creditPackages = await syncCreditPackages();

	return {
		success: true,
		message: `Successfully synced ${plans.length} membership plans and ${creditPackages.length} credit packages from Lemon Squeezy`,
		plans,
		creditPackages,
	};
}

/**
 * Get subscription URLs (update payment method, customer portal)
 */
export async function getSubscriptionURLs() {
	configureLemonSqueezy();

	const activeOrg = await getActiveOrganization();

	if (!activeOrg) {
		throw new Error("No active organization found.");
	}

	const orgMembership = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.organizationId, activeOrg.id));

	if (orgMembership.length === 0) {
		throw new Error("No subscription found for this organization.");
	}

	const subscriptionId = orgMembership[0].lemonSqueezySubscriptionId;

	if (!subscriptionId) {
		throw new Error(
			"No Lemon Squeezy subscription ID found for this organization."
		);
	}

	const subscription = await getSubscription(subscriptionId);

	if (subscription.error) {
		throw new Error(subscription.error.message);
	}

	return subscription.data?.data.attributes.urls;
}

/**
 * Process a webhook event from Lemon Squeezy
 */
export async function processWebhookEvent(event: {
	meta?: {
		event_name: string;
		custom_data?: {
			user_id: string;
			organization_id?: string;
			membership_name?: string;
			billing_cycle?: "monthly" | "yearly";
			credit_amount?: number;
			is_credit_purchase?: boolean;
		};
	};
	data?: {
		attributes: {
			status: string;
			ends_at: string | null;
		};
		id: string;
	};
}) {
	if (!event.meta || !event.data) {
		throw new Error("Invalid webhook event data");
	}

	const eventName = event.meta.event_name;

	// Handle subscription_created event
	if (
		eventName === "subscription_created" &&
		event.meta.custom_data &&
		event.meta.custom_data.membership_name &&
		event.meta.custom_data.organization_id
	) {
		await handleSubscriptionCreated({
			meta: {
				custom_data: {
					user_id: event.meta.custom_data.user_id,
					organization_id: event.meta.custom_data.organization_id,
					membership_name: event.meta.custom_data.membership_name,
					billing_cycle: event.meta.custom_data.billing_cycle,
				},
			},
			data: event.data,
		});
	}

	// Handle order_created event for credit purchases
	if (
		eventName === "order_created" &&
		event.meta.custom_data &&
		event.meta.custom_data.is_credit_purchase &&
		event.meta.custom_data.credit_amount &&
		event.meta.custom_data.organization_id
	) {
		await handleCreditPurchase({
			meta: {
				custom_data: {
					user_id: event.meta.custom_data.user_id,
					organization_id: event.meta.custom_data.organization_id,
					credit_amount: event.meta.custom_data.credit_amount,
					is_credit_purchase: true,
				},
			},
			data: event.data,
		});
	}

	// Handle subscription_updated event
	if (eventName === "subscription_updated") {
		await handleSubscriptionUpdated({ data: event.data });
	}

	// Handle subscription_cancelled event
	if (eventName === "subscription_cancelled") {
		await handleSubscriptionCancelled({ data: event.data });
	}

	// TODO: Implement handlers for payment-related webhook events
	// These handlers should update the subscription status and send email notifications
	// - subscription_payment_failed: Update status to "unpaid" and notify user to update payment method
	// - subscription_payment_recovered: Update status back to "active" and send confirmation
	// - subscription_payment_success: For renewal confirmations
}

/**
 * Handle credit purchase webhook event
 */
async function handleCreditPurchase(event: {
	meta: {
		custom_data: {
			user_id: string;
			organization_id: string;
			credit_amount: number;
			is_credit_purchase: boolean;
		};
	};
	data: {
		id: string;
		attributes: Record<string, unknown>;
	};
}) {
	const organizationId = event.meta.custom_data.organization_id;
	const creditAmount = event.meta.custom_data.credit_amount;

	// Get the organization
	const org = await db
		.select()
		.from(organization)
		.where(eq(organization.id, organizationId));

	if (org.length === 0) {
		throw new Error(`Organization ${organizationId} not found.`);
	}

	// Add credits to organization - ensure both values are treated as numbers
	await db
		.update(organization)
		.set({
			credits: Number(org[0].credits) + Number(creditAmount),
		})
		.where(eq(organization.id, organizationId));
}

/**
 * Handle subscription_created webhook event
 */
async function handleSubscriptionCreated(event: {
	meta: {
		custom_data: {
			user_id: string;
			organization_id: string;
			membership_name: string;
			billing_cycle?: "monthly" | "yearly";
		};
	};
	data: {
		attributes: {
			status: string;
			ends_at: string | null;
			created_at?: string;
			renews_at?: string;
		};
		id: string;
	};
}) {
	const attributes = event.data.attributes;
	const userId = event.meta.custom_data.user_id;
	const organizationId = event.meta.custom_data.organization_id;
	const membershipName = event.meta.custom_data.membership_name as
		| "silver"
		| "gold"
		| "lifetime";
	const billingCycle = event.meta.custom_data.billing_cycle || "monthly";

	// Get the membership tier
	// For lifetime, ignore billing cycle
	const dbTierName =
		membershipName === "lifetime"
			? "lifetime"
			: (`${membershipName}_${billingCycle}` as
					| "silver_monthly"
					| "silver_yearly"
					| "gold_monthly"
					| "gold_yearly"
					| "lifetime");

	// Get the membership tier from the config file
	const membershipTiers = await getMembershipTiers();
	const membership = membershipTiers.find((tier) => tier.name === dbTierName);

	if (!membership) {
		throw new Error(`Membership tier ${dbTierName} not found in config.`);
	}

	// Check if organization already has a membership
	const existingMembership = await db
		.select()
		.from(organizationMemberships)
		.where(eq(organizationMemberships.organizationId, organizationId));

	if (existingMembership.length > 0) {
		// Update existing membership
		await db
			.update(organizationMemberships)
			.set({
				membershipId: dbTierName, // Store the tier name as the membership ID
				status: attributes.status,
				lemonSqueezySubscriptionId: event.data.id,
				startDate: new Date(),
				endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
				updatedAt: new Date(),
			})
			.where(eq(organizationMemberships.organizationId, organizationId));
	} else {
		// Create new organization membership
		await db.insert(organizationMemberships).values({
			organizationId,
			membershipId: dbTierName, // Store the tier name as the membership ID
			status: attributes.status,
			lemonSqueezySubscriptionId: event.data.id,
			startDate: new Date(),
			endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	}

	// Get the organization to access its existing credits
	const org = await db
		.select()
		.from(organization)
		.where(eq(organization.id, organizationId));

	if (org.length === 0) {
		throw new Error(`Organization ${organizationId} not found.`);
	}

	// Add membership credits to organization's existing credits instead of overwriting
	await db
		.update(organization)
		.set({
			credits: Number(org[0].credits) + Number(membership.credits),
		})
		.where(eq(organization.id, organizationId));

	// Get the user to send welcome email
	const currentUser = await db.select().from(user).where(eq(user.id, userId));

	if (currentUser.length === 0) {
		throw new Error(`User ${userId} not found.`);
	}

	// Send welcome email
	try {
		await sendSubscriptionCreatedEmail(currentUser[0].email, {
			name: currentUser[0].name,
			planName:
				membershipName.charAt(0).toUpperCase() + membershipName.slice(1), // Capitalize first letter
			startDate: format(new Date(), "MMMM d, yyyy"),
			nextBillingDate: attributes.renews_at
				? format(new Date(attributes.renews_at), "MMMM d, yyyy")
				: undefined,
			amount: membership.price.toString(),
			currency: "$", // Default currency symbol
		});
		console.log(`Sent welcome email to ${currentUser[0].email}`);
	} catch (error) {
		console.error("Error sending welcome email:", error);
		// Continue processing even if email fails
	}
}

/**
 * Handle subscription_updated webhook event
 */
async function handleSubscriptionUpdated(event: {
	data: {
		attributes: {
			status: string;
			ends_at: string | null;
			renews_at?: string;
			changes?: Record<string, { old: string; new: string }>;
		};
		id: string;
	};
}) {
	const attributes = event.data.attributes;
	const subscriptionId = event.data.id;

	// Find the organization membership with this subscription ID
	const orgMembership = await db
		.select()
		.from(organizationMemberships)
		.where(
			eq(organizationMemberships.lemonSqueezySubscriptionId, subscriptionId)
		);

	if (orgMembership.length === 0) {
		throw new Error(
			`No organization membership found for subscription ${subscriptionId}`
		);
	}

	// Update the organization membership
	await db
		.update(organizationMemberships)
		.set({
			status: attributes.status,
			endDate: attributes.ends_at ? new Date(attributes.ends_at) : null,
			updatedAt: new Date(),
		})
		.where(
			eq(organizationMemberships.lemonSqueezySubscriptionId, subscriptionId)
		);

	// Just update the database, no email sent for subscription updates
}

/**
 * Handle subscription_cancelled webhook event
 */
async function handleSubscriptionCancelled(event: {
	data: {
		attributes: {
			status: string;
			ends_at: string | null;
		};
		id: string;
	};
}) {
	const attributes = event.data.attributes;
	const subscriptionId = event.data.id;

	// Find the organization membership with this subscription ID
	const orgMembership = await db
		.select()
		.from(organizationMemberships)
		.where(
			eq(organizationMemberships.lemonSqueezySubscriptionId, subscriptionId)
		);

	if (orgMembership.length === 0) {
		throw new Error(
			`No organization membership found for subscription ${subscriptionId}`
		);
	}

	// Update the organization membership
	await db
		.update(organizationMemberships)
		.set({
			status: "cancelled",
			endDate: attributes.ends_at ? new Date(attributes.ends_at) : new Date(),
			updatedAt: new Date(),
		})
		.where(
			eq(organizationMemberships.lemonSqueezySubscriptionId, subscriptionId)
		);

	// Get the organization ID
	const organizationId = orgMembership[0].organizationId;

	// Get the organization to find its members
	const members = await db
		.select({
			userId: member.userId,
		})
		.from(member)
		.where(eq(member.organizationId, organizationId));

	if (members.length === 0) {
		console.error(`No members found for organization ${organizationId}`);
		return;
	}

	// Get the first member (likely the owner) to send the email to
	const userId = members[0].userId;
	const currentUser = await db.select().from(user).where(eq(user.id, userId));

	if (currentUser.length === 0) {
		console.error(`User ${userId} not found for sending cancellation email.`);
		return;
	}

	// Get the membership tier
	const membershipId = orgMembership[0].membershipId;
	const membershipTiers = await getMembershipTiers();
	const membership = membershipTiers.find((tier) => tier.name === membershipId);

	if (!membership) {
		console.error(
			`Membership tier ${membershipId} not found for sending cancellation email.`
		);
		return;
	}

	// Extract the base tier name from the membership ID (e.g., "silver_monthly" -> "Silver")
	const baseTierName = membershipId.split("_")[0];
	const planName = baseTierName.charAt(0).toUpperCase() + baseTierName.slice(1);

	// Send cancellation email
	try {
		await sendSubscriptionCancelledEmail(currentUser[0].email, {
			name: currentUser[0].name,
			planName: planName,
			endDate: format(
				attributes.ends_at ? new Date(attributes.ends_at) : new Date(),
				"MMMM d, yyyy"
			),
		});
		console.log(`Sent cancellation email to ${currentUser[0].email}`);
	} catch (error) {
		console.error("Error sending cancellation email:", error);
		// Continue processing even if email fails
	}
}
