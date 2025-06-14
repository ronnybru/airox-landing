import { getCreditPackages } from "@/app/actions/membership";
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

export async function CreditPackages() {
	const creditPackages = await getCreditPackages();

	return (
		<div className='space-y-4'>
			<H3>Credit Packages</H3>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Credits</TableHead>
						<TableHead>Price</TableHead>
						<TableHead>Lemon Squeezy Product ID</TableHead>
						<TableHead>Lemon Squeezy Variant ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{creditPackages.map((pkg, index) => (
						<TableRow key={index}>
							<TableCell className='font-medium'>{pkg.amount}</TableCell>
							<TableCell>{formatCurrency(pkg.price / 100)}</TableCell>
							<TableCell>{pkg.productId || "Not synced"}</TableCell>
							<TableCell>{pkg.variantId || "Not synced"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
