import { H1, Paragraph } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import { SyncButton } from "./components/sync-button";
import { MembershipTiers } from "./components/membership-tiers";
import { CreditPackages } from "./components/credit-packages";
import { Suspense } from "react";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
	// Check admin access before rendering the page
	await checkAdminAccess();

	return (
		<div className='container mx-auto py-10 px-4 overflow-y-auto'>
			<div className='flex flex-col md:flex-row justify-between items-start mb-8'>
				<div>
					<H1>Membership Administration</H1>
					<Paragraph>
						Manage membership tiers and Lemon Squeezy integration.
					</Paragraph>
				</div>
			</div>

			<Card className='mb-8'>
				<CardHeader>
					<CardTitle>Sync with Lemon Squeezy</CardTitle>
				</CardHeader>
				<CardContent>
					<Paragraph className='mb-4'>
						This will sync both membership tiers and credit packages with Lemon
						Squeezy. Make sure you have set up the Lemon Squeezy API key, store
						ID, and webhook secret in your .env file. For credit packages,
						ensure you have created products with variants named &quot;100
						Credits&quot;, &quot;1000 Credits&quot;, and &quot;5000
						Credits&quot;. Or that you change the values to match in config if
						you want to use other values and names.
					</Paragraph>
					<Suspense fallback={<div>Loading...</div>}>
						<SyncButton />
					</Suspense>
				</CardContent>
			</Card>

			<div className='grid gap-8 md:grid-cols-1 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Membership Tiers</CardTitle>
					</CardHeader>
					<CardContent>
						<Suspense fallback={<div>Loading membership tiers...</div>}>
							<MembershipTiers />
						</Suspense>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Credit Packages</CardTitle>
					</CardHeader>
					<CardContent>
						<Suspense fallback={<div>Loading credit packages...</div>}>
							<CreditPackages />
						</Suspense>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
