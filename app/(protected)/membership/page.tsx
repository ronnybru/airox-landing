"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { H2, Paragraph } from "@/components/ui/typography";
import { PageHeader } from "@/components/page-header";
import CreditPurchaseOptions from "./components/CreditPurchaseOptions";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	getOrganizationMembership,
	getCheckoutURL,
	getSubscriptionURLs,
	getMembershipTiers,
} from "@/app/actions/membership";
import { toast } from "sonner";

// Define membership tier types for checkout
type CheckoutTier = "silver" | "gold" | "lifetime";

// Define the config membership tier type from the config file
interface ConfigMembershipTier {
	name:
		| "silver_monthly"
		| "silver_yearly"
		| "gold_monthly"
		| "gold_yearly"
		| "lifetime";
	price: number;
	credits: number;
	lemonSqueezyVariantId: number | null;
	lemonSqueezyProductId: number | null;
	active: boolean;
	uiData: {
		title: string;
		features: string[];
		badge: string;
		color: string;
	};
}

// Define the UI membership tier type
interface UIMembershipTier {
	name: CheckoutTier;
	title: string;
	price: number;
	yearlyPrice: number | null;
	credits: number;
	features: string[];
	badge: string;
	color: string;
}

// Define the user membership data type
interface organizationMembershipData {
	organizationMembership: {
		id: number;
		userId: string;
		membershipId: string;
		startDate: Date | string;
		endDate: Date | string | null;
		status: string;
		lemonSqueezySubscriptionId: string | null;
		createdAt: Date | string;
		updatedAt: Date | string;
	};
	membership: ConfigMembershipTier;
}

// Helper function to determine tier level for comparison
function getTierLevel(tierName: string): number {
	switch (tierName) {
		case "silver":
			return 1;
		case "gold":
			return 2;
		case "lifetime":
			return 3;
		default:
			return 0;
	}
}

export default function MembershipPage() {
	const { data: session, isPending } = useSession();
	const [uiMembershipTiers, setUiMembershipTiers] = useState<
		UIMembershipTier[]
	>([]);

	const [organizationMembership, setorganizationMembership] =
		useState<organizationMembershipData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [tiersLoading, setTiersLoading] = useState<boolean>(true);
	const [checkoutLoading, setCheckoutLoading] = useState<CheckoutTier | null>(
		null
	);
	const [managingSubscription, setManagingSubscription] =
		useState<boolean>(false);
	const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
		"yearly"
	);

	useEffect(() => {
		async function fetchorganizationMembership() {
			if (session) {
				try {
					const orgMembership = await getOrganizationMembership();
					if (orgMembership) {
						// Map organization membership to user membership format
						setorganizationMembership({
							organizationMembership: {
								id: orgMembership.organizationMembership.id,
								userId: "", // Not needed anymore
								membershipId: orgMembership.organizationMembership.membershipId,
								startDate: orgMembership.organizationMembership.startDate,
								endDate: orgMembership.organizationMembership.endDate,
								status: orgMembership.organizationMembership.status,
								lemonSqueezySubscriptionId:
									orgMembership.organizationMembership
										.lemonSqueezySubscriptionId,
								createdAt: orgMembership.organizationMembership.createdAt,
								updatedAt: orgMembership.organizationMembership.updatedAt,
							},
							membership: orgMembership.membership,
						});
					}
				} catch (error) {
					console.error("Error fetching organization membership:", error);
					toast.error("Failed to load membership information");
				} finally {
					setLoading(false);
				}
			}
		}

		async function fetchMembershipTiers() {
			try {
				// Explicitly type the tiers as ConfigMembershipTier[]
				const tiers =
					(await getMembershipTiers()) as unknown as ConfigMembershipTier[];

				// Process tiers for UI
				const processedTiers: UIMembershipTier[] = [];

				// Process silver tiers
				const silverMonthly = tiers.find(
					(tier) => tier.name === "silver_monthly" && tier.active
				);
				const silverYearly = tiers.find(
					(tier) => tier.name === "silver_yearly" && tier.active
				);
				if (silverMonthly && silverYearly) {
					processedTiers.push({
						name: "silver",
						title: silverMonthly.uiData.title,
						price: silverMonthly.price / 100, // Convert cents to dollars
						yearlyPrice: silverYearly.price / 1200, // Convert yearly cents to monthly dollars
						credits: silverMonthly.credits,
						features: silverMonthly.uiData.features,
						badge: silverMonthly.uiData.badge,
						color: silverMonthly.uiData.color,
					});
				}

				// Process gold tiers
				const goldMonthly = tiers.find(
					(tier) => tier.name === "gold_monthly" && tier.active
				);
				const goldYearly = tiers.find(
					(tier) => tier.name === "gold_yearly" && tier.active
				);
				if (goldMonthly && goldYearly) {
					processedTiers.push({
						name: "gold",
						title: goldMonthly.uiData.title,
						price: goldMonthly.price / 100, // Convert cents to dollars
						yearlyPrice: goldYearly.price / 1200, // Convert yearly cents to monthly dollars
						credits: goldMonthly.credits,
						features: goldMonthly.uiData.features,
						badge: goldMonthly.uiData.badge,
						color: goldMonthly.uiData.color,
					});
				}

				// Process lifetime tier
				const lifetime = tiers.find(
					(tier) => tier.name === "lifetime" && tier.active
				);
				if (lifetime) {
					processedTiers.push({
						name: "lifetime",
						title: lifetime.uiData.title,
						price: lifetime.price / 100, // Convert cents to dollars
						yearlyPrice: null, // One-time payment
						credits: lifetime.credits,
						features: lifetime.uiData.features,
						badge: lifetime.uiData.badge,
						color: lifetime.uiData.color,
					});
				}

				setUiMembershipTiers(processedTiers);
			} catch (error) {
				console.error("Error fetching membership tiers:", error);
				toast.error("Failed to load membership tiers");
			} finally {
				setTiersLoading(false);
			}
		}

		if (!isPending) {
			fetchorganizationMembership();
			fetchMembershipTiers();
		}
	}, [session, isPending]);

	const handleCheckout = async (tier: CheckoutTier) => {
		if (!session) {
			toast.error("You must be logged in to purchase a membership");
			return;
		}

		setCheckoutLoading(tier);
		try {
			// Pass the selected billing cycle to getCheckoutURL
			// For lifetime tier, billing cycle doesn't matter
			// Use direct checkout URL (embed=false) for better conversion
			const checkoutUrl = await getCheckoutURL(tier, billingCycle, false);
			if (checkoutUrl) {
				// Redirect to the checkout page in the same window
				window.location.href = checkoutUrl;
			} else {
				toast.error("Failed to create checkout");
			}
		} catch (error) {
			console.error("Error creating checkout:", error);
			toast.error("Failed to create checkout");
		} finally {
			setCheckoutLoading(null);
		}
	};

	const handlePlanChange = async (tier: CheckoutTier) => {
		if (!session) {
			toast.error("You must be logged in to change your membership");
			return;
		}

		if (!organizationMembership) {
			toast.error("No active membership found");
			return;
		}

		// Make sure the subscription is active
		if (organizationMembership.organizationMembership.status !== "active") {
			toast.error(
				"Your subscription is not active. Please reactivate it first."
			);
			return;
		}

		setCheckoutLoading(tier);
		try {
			// Get the subscription ID
			const subscriptionId =
				organizationMembership.organizationMembership
					.lemonSqueezySubscriptionId;

			if (!subscriptionId) {
				toast.error("No subscription ID found");
				return;
			}

			// Get the customer portal URL
			const urls = await getSubscriptionURLs();
			if (urls && urls.customer_portal) {
				// Redirect to the customer portal where they can change their plan
				window.location.href = urls.customer_portal;
				toast.success("Redirecting to subscription management portal");
			} else {
				toast.error("Could not access subscription management portal");
			}
		} catch (error) {
			console.error("Error changing plan:", error);
			toast.error("Failed to change plan");
		} finally {
			setCheckoutLoading(null);
		}
	};

	if (isPending || loading || tiersLoading) {
		return (
			<div className='container mx-auto py-10 px-4'>
				<div className='flex justify-center items-center min-h-[300px]'>
					<div className='flex space-x-2'>
						<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse'></div>
						<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75'></div>
						<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150'></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title='Membership Plans'
				subtitle='Choose the plan that works best for you. All plans include access to our core features.'
			/>

			{organizationMembership && (
				<Card className='mb-8'>
					<CardHeader>
						<CardTitle>Your Current Membership</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col md:flex-row justify-between'>
							<div>
								<H2 className='mb-2'>
									{organizationMembership.membership.name
										.charAt(0)
										.toUpperCase() +
										organizationMembership.membership.name.slice(1)}
								</H2>
								<Paragraph>
									Status:{" "}
									<Badge
										variant={
											organizationMembership.organizationMembership.status ===
											"active"
												? "default"
												: "destructive"
										}>
										{organizationMembership.organizationMembership.status}
									</Badge>
								</Paragraph>
								<Paragraph>
									Credits: {organizationMembership.membership.credits}
								</Paragraph>
								{organizationMembership.organizationMembership.endDate && (
									<Paragraph>
										{organizationMembership.organizationMembership.status ===
										"active"
											? `Renews on: ${new Date(
													organizationMembership.organizationMembership.endDate
												).toLocaleDateString()}`
											: `Expires on: ${new Date(
													organizationMembership.organizationMembership.endDate
												).toLocaleDateString()}`}
									</Paragraph>
								)}
							</div>
							<div className='mt-4 md:mt-0'>
								{organizationMembership.organizationMembership.status ===
									"active" && (
									<Button
										variant='outline'
										className='mr-2'
										onClick={async () => {
											try {
												setManagingSubscription(true);
												const urls = await getSubscriptionURLs();
												if (urls && urls.customer_portal) {
													window.location.href = urls.customer_portal;
												} else {
													toast.error(
														"Could not access subscription management portal"
													);
												}
											} catch (error) {
												console.error(
													"Error accessing subscription portal:",
													error
												);
												toast.error("Failed to access subscription management");
											} finally {
												setManagingSubscription(false);
											}
										}}
										disabled={managingSubscription}>
										{managingSubscription
											? "Loading..."
											: "Manage Subscription"}
									</Button>
								)}
								{organizationMembership.organizationMembership.status !==
									"active" && (
									<Button
										onClick={async () => {
											try {
												setCheckoutLoading("silver"); // Use as loading indicator
												// Extract the base tier from the membership name (e.g., "silver_monthly" -> "silver")
												const membershipName =
													organizationMembership.membership.name;
												const baseTier = membershipName.split(
													"_"
												)[0] as CheckoutTier;
												// Extract billing cycle if available
												const billingCycle = membershipName.includes("_")
													? (membershipName.split("_")[1] as
															| "monthly"
															| "yearly")
													: "monthly";

												// Create a new checkout for the same membership tier
												const checkoutUrl = await getCheckoutURL(
													baseTier,
													billingCycle,
													false
												);

												if (checkoutUrl) {
													window.location.href = checkoutUrl;
												} else {
													toast.error("Failed to create checkout");
												}
											} catch (error) {
												console.error(
													"Error reactivating subscription:",
													error
												);
												toast.error("Failed to reactivate subscription");
											} finally {
												setCheckoutLoading(null);
											}
										}}
										disabled={checkoutLoading !== null}>
										{checkoutLoading !== null ? "Loading..." : "Reactivate"}
									</Button>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<div className='flex justify-center mb-8'>
				<div className='bg-gray-100 p-2 rounded-lg inline-flex'>
					<Button
						variant={billingCycle === "monthly" ? "default" : "ghost"}
						onClick={() => setBillingCycle("monthly")}
						className='rounded-r-none'>
						Monthly
					</Button>
					<Button
						variant={billingCycle === "yearly" ? "default" : "ghost"}
						onClick={() => setBillingCycle("yearly")}
						className='rounded-l-none'>
						Yearly (30% off)
					</Button>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{uiMembershipTiers.map((tier) => {
					// Determine if this is the current membership
					const isCurrentMembership =
						organizationMembership &&
						organizationMembership.membership.name.startsWith(tier.name);

					// Get the current tier level for comparison
					const currentTierLevel = organizationMembership
						? getTierLevel(organizationMembership.membership.name.split("_")[0])
						: -1;

					// Get this tier's level
					const thisTierLevel = getTierLevel(tier.name);

					// Determine if this is an upgrade or downgrade
					const isUpgrade =
						currentTierLevel !== -1 && thisTierLevel > currentTierLevel;
					const isDowngrade =
						currentTierLevel !== -1 && thisTierLevel < currentTierLevel;

					// Set border color based on status
					let borderClass = "border-transparent";
					if (isCurrentMembership) {
						borderClass = "border-green-500";
					} else if (isUpgrade) {
						borderClass = "border-blue-500";
					} else if (isDowngrade) {
						borderClass = "border-amber-500";
					}

					// Set badge text based on status
					let badgeText = tier.badge;
					let badgeVariant:
						| "default"
						| "secondary"
						| "outline"
						| "destructive" = "secondary";

					if (isCurrentMembership) {
						badgeText = "Current Plan";
						badgeVariant = "default";
					} else if (isUpgrade) {
						badgeText = "Upgrade";
						badgeVariant = "secondary";
					} else if (isDowngrade) {
						badgeText = "Downgrade";
						badgeVariant = "outline";
					}

					// Set button text based on status
					let buttonText = "Get Started";
					if (isCurrentMembership) {
						buttonText = "Current Plan";
					} else if (isUpgrade) {
						buttonText = "Upgrade";
					} else if (isDowngrade) {
						buttonText = "Downgrade";
					}

					return (
						<Card
							key={tier.name}
							className={`${tier.color} border-2 ${borderClass} flex flex-col h-full`}>
							<CardHeader>
								<div className='flex justify-between items-center'>
									<CardTitle>{tier.title}</CardTitle>
									<Badge variant={badgeVariant}>{badgeText}</Badge>
								</div>
							</CardHeader>
							<CardContent className='flex-grow'>
								<div className='mb-4'>
									{tier.name === "lifetime" ? (
										<div className='text-3xl font-bold'>
											${tier.price.toFixed(2)}
										</div>
									) : (
										<div className='text-3xl font-bold'>
											$
											{billingCycle === "yearly"
												? tier.yearlyPrice?.toFixed(2)
												: tier.price.toFixed(2)}
											<span className='text-sm font-normal text-gray-500'>
												{billingCycle === "yearly"
													? "/mo (billed yearly)"
													: "/month"}
											</span>
										</div>
									)}
								</div>
								<ul className='space-y-2'>
									{tier.features.map((feature, index) => (
										<li key={index} className='flex items-start'>
											<svg
												className='h-5 w-5 text-green-500 mr-2'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth={2}
													d='M5 13l4 4L19 7'
												/>
											</svg>
											{feature}
										</li>
									))}
								</ul>
							</CardContent>
							<CardFooter className='mt-auto'>
								<Button
									className='w-full'
									onClick={() => {
										if (isUpgrade || isDowngrade) {
											handlePlanChange(tier.name);
										} else {
											handleCheckout(tier.name);
										}
									}}
									disabled={
										checkoutLoading === tier.name ||
										isCurrentMembership ||
										false
									}
									variant={isCurrentMembership ? "outline" : "default"}>
									{checkoutLoading === tier.name ? "Loading..." : buttonText}
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			<div className='mt-8'>
				<Paragraph className='text-center text-gray-500'>
					All plans come with a 14-day money-back guarantee. No questions asked.
				</Paragraph>
			</div>

			{/* Credit Purchase Options */}
			<CreditPurchaseOptions />
		</>
	);
}
