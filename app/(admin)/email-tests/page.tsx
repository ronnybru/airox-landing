import { Suspense } from "react";
import { H2, Paragraph } from "@/components/ui/typography";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchEmailTestStats } from "@/app/actions/email-test-stats";
import ResetButton from "./reset-button";
import { checkAdminAccess } from "@/app/actions/user-helpers";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export const metadata = {
	title: "Email Split Tests | Admin",
	description: "Track and analyze email split test results",
};

async function EmailTestStats() {
	await checkAdminAccess();
	const stats = await fetchEmailTestStats();

	return (
		<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Total Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.totalUsers}</div>
					<p className='text-xs text-muted-foreground'>
						Users who received welcome emails
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Variant A Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.variantAUsers}</div>
					<p className='text-xs text-muted-foreground'>
						{Math.round((stats.variantAUsers / stats.totalUsers) * 100) || 0}%
						of total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Variant B Users</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>{stats.variantBUsers}</div>
					<p className='text-xs text-muted-foreground'>
						{Math.round((stats.variantBUsers / stats.totalUsers) * 100) || 0}%
						of total
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<CardTitle className='text-sm font-medium'>Conversion Rate</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='text-2xl font-bold'>
						{Math.round((stats.totalConversions / stats.totalUsers) * 100) || 0}
						%
					</div>
					<p className='text-xs text-muted-foreground'>
						Overall conversion to paid
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

function ConversionComparison() {
	return (
		<Suspense fallback={<div>Loading conversion data...</div>}>
			<ConversionComparisonContent />
		</Suspense>
	);
}

async function ConversionComparisonContent() {
	const stats = await fetchEmailTestStats();

	const variantAConversionRate =
		Math.round((stats.variantAConversions / stats.variantAUsers) * 100) || 0;
	const variantBConversionRate =
		Math.round((stats.variantBConversions / stats.variantBUsers) * 100) || 0;

	const difference = variantBConversionRate - variantAConversionRate;
	const improvement =
		difference > 0
			? `+${difference}% improvement with Variant B`
			: difference < 0
				? `+${Math.abs(difference)}% improvement with Variant A`
				: "No difference between variants";

	const winner = difference > 0 ? "B" : difference < 0 ? "A" : "None";

	return (
		<div className='grid gap-4 md:grid-cols-2'>
			<Card>
				<CardHeader>
					<CardTitle>Variant A Conversion</CardTitle>
					<CardDescription>Original email templates</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-4xl font-bold'>{variantAConversionRate}%</div>
					<div className='mt-4 h-4 w-full rounded-full bg-secondary'>
						<div
							className='h-4 rounded-full bg-primary'
							style={{ width: `${variantAConversionRate}%` }}
						/>
					</div>
					<div className='mt-2 text-sm text-muted-foreground'>
						{stats.variantAConversions} conversions from {stats.variantAUsers}{" "}
						users
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Variant B Conversion</CardTitle>
					<CardDescription>Alternative email templates</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-4xl font-bold'>{variantBConversionRate}%</div>
					<div className='mt-4 h-4 w-full rounded-full bg-secondary'>
						<div
							className='h-4 rounded-full bg-primary'
							style={{ width: `${variantBConversionRate}%` }}
						/>
					</div>
					<div className='mt-2 text-sm text-muted-foreground'>
						{stats.variantBConversions} conversions from {stats.variantBUsers}{" "}
						users
					</div>
				</CardContent>
			</Card>

			<Card className='md:col-span-2'>
				<CardHeader>
					<CardTitle>Comparison Results</CardTitle>
					<CardDescription>
						Based on conversion to paid membership after 7-day trial
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-xl font-medium'>{improvement}</div>
					{winner !== "None" && (
						<div className='mt-2 text-sm text-muted-foreground'>
							Variant {winner} is currently performing better. Consider making
							it the default or further optimizing it.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function TimeToConversion() {
	return (
		<Suspense fallback={<div>Loading time data...</div>}>
			<TimeToConversionContent />
		</Suspense>
	);
}

async function TimeToConversionContent() {
	const stats = await fetchEmailTestStats();

	return (
		<div className='grid gap-4 md:grid-cols-2'>
			<Card>
				<CardHeader>
					<CardTitle>Average Time to Conversion</CardTitle>
					<CardDescription>Days from signup to paid membership</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<div className='text-sm font-medium'>Variant A</div>
							<div className='text-2xl font-bold'>
								{stats.variantAAvgDaysToConversion.toFixed(1)} days
							</div>
						</div>
						<div>
							<div className='text-sm font-medium'>Variant B</div>
							<div className='text-2xl font-bold'>
								{stats.variantBAvgDaysToConversion.toFixed(1)} days
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Conversion Timeline</CardTitle>
					<CardDescription>When users convert during trial</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<div className='text-sm'>Day 1-3</div>
							<div className='text-sm font-medium'>
								A: {stats.variantAEarlyConversions} | B:{" "}
								{stats.variantBEarlyConversions}
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<div className='text-sm'>Day 4-6</div>
							<div className='text-sm font-medium'>
								A: {stats.variantAMidConversions} | B:{" "}
								{stats.variantBMidConversions}
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<div className='text-sm'>Day 7+</div>
							<div className='text-sm font-medium'>
								A: {stats.variantALateConversions} | B:{" "}
								{stats.variantBLateConversions}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Server component for the page
export default async function EmailTestsPage() {
	// Check admin access before rendering the page
	await checkAdminAccess();
	return (
		<div className='container mx-auto py-10'>
			<div className='flex justify-between items-center mb-6'>
				<div>
					<H2 className='mb-2'>Welcome Email Split Tests</H2>
					<Paragraph className='text-muted-foreground'>
						Track and analyze the performance of different welcome email
						variants
					</Paragraph>
				</div>
			</div>

			<div className='space-y-8'>
				<EmailTestStats />

				<Tabs defaultValue='conversion'>
					<TabsList>
						<TabsTrigger value='conversion'>Conversion Comparison</TabsTrigger>
						<TabsTrigger value='timeline'>Time to Conversion</TabsTrigger>
						<TabsTrigger value='reset'>Reset Test</TabsTrigger>
					</TabsList>
					<TabsContent value='conversion' className='mt-6'>
						<ConversionComparison />
					</TabsContent>
					<TabsContent value='timeline' className='mt-6'>
						<TimeToConversion />
					</TabsContent>
					<TabsContent value='reset' className='mt-6'>
						<ResetButton />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
