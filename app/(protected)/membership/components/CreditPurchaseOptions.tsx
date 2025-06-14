"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { H2, Paragraph } from "@/components/ui/typography";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	getCreditPackages,
	getCreditCheckoutURL,
} from "@/app/actions/membership";
import { toast } from "sonner";
import type { CreditPackage } from "@/app/actions/membership";

export default function CreditPurchaseOptions() {
	const { data: session, isPending } = useSession();
	const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [checkoutLoading, setCheckoutLoading] = useState<number | null>(null);

	useEffect(() => {
		async function fetchCreditPackages() {
			if (session) {
				try {
					const packages = await getCreditPackages();
					setCreditPackages(packages);
				} catch (error) {
					console.error("Error fetching credit packages:", error);
					toast.error("Failed to load credit packages");
				} finally {
					setLoading(false);
				}
			}
		}

		if (!isPending) {
			fetchCreditPackages();
		}
	}, [session, isPending]);

	const handleCheckout = async (creditAmount: number) => {
		if (!session) {
			toast.error("You must be logged in to purchase credits");
			return;
		}

		setCheckoutLoading(creditAmount);
		try {
			// Use direct checkout URL (embed=false) for better conversion
			const checkoutUrl = await getCreditCheckoutURL(creditAmount, false);
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

	if (isPending || loading) {
		return (
			<div className='flex justify-center items-center min-h-[200px]'>
				<div className='flex space-x-2'>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse'></div>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75'></div>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150'></div>
				</div>
			</div>
		);
	}

	return (
		<div className='mt-12'>
			<div className='mb-8'>
				<H2>Purchase Credits</H2>
				<Paragraph>
					Need more credits? Purchase additional credits to use with your
					account.
				</Paragraph>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{creditPackages.map((pkg) => (
					<Card
						key={pkg.amount}
						className='bg-gray-50 border-2 border-transparent hover:border-blue-200 transition-all flex flex-col h-full'>
						<CardHeader>
							<CardTitle>{pkg.amount} Credits</CardTitle>
						</CardHeader>
						<CardContent className='flex-grow'>
							<div className='mb-4'>
								<div className='text-3xl font-bold'>
									${(pkg.price / 100).toFixed(2)}
								</div>
								<div className='text-sm text-gray-500'>
									${(pkg.price / pkg.amount / 100).toFixed(2)} per credit
								</div>
							</div>
							<Paragraph>
								Add {pkg.amount} credits to your account instantly.
							</Paragraph>
						</CardContent>
						<CardFooter className='mt-auto'>
							<Button
								className='w-full'
								onClick={() => handleCheckout(pkg.amount)}
								disabled={checkoutLoading === pkg.amount}>
								{checkoutLoading === pkg.amount ? "Loading..." : "Purchase Now"}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
