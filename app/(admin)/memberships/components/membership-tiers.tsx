import { getMembershipTiers } from "@/app/actions/membership";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { H3 } from "@/components/ui/typography";

// Simple currency formatter
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount);
};

export async function MembershipTiers() {
	const membershipTiers = await getMembershipTiers();

	return (
		<div className='space-y-4'>
			<H3>Current Membership Tiers</H3>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Credits</TableHead>
						<TableHead>Lemon Squeezy Product ID</TableHead>
						<TableHead>Lemon Squeezy Variant ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{membershipTiers.map((tier) => (
						<TableRow key={tier.name}>
							<TableCell className='font-medium'>
								{tier.name
									.replace("_", " ")
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
									.join(" ")}
							</TableCell>
							<TableCell>{formatCurrency(tier.price / 100)}</TableCell>
							<TableCell>{tier.credits}</TableCell>
							<TableCell>
								{tier.lemonSqueezyProductId || "Not synced"}
							</TableCell>
							<TableCell>
								{tier.lemonSqueezyVariantId || "Not synced"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
