"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { syncAllProducts } from "@/app/actions/membership";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SyncResult {
	success: boolean;
	message: string;
	plans?: Array<{
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
	}>;
	creditPackages?: Array<{
		amount: number;
		price: number;
		variantId?: number | null;
		productId?: number | null;
	}>;
	error?: unknown;
}

export function SyncButton() {
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<SyncResult | null>(null);
	const router = useRouter();

	const handleSyncProducts = async () => {
		setLoading(true);
		try {
			const response = await syncAllProducts();
			setResult(response);

			if (response.success) {
				toast.success(response.message);
				// Refresh the page to show updated data
				router.refresh();
			} else {
				toast.error(response.message);
			}
		} catch (error) {
			console.error("Error syncing products:", error);
			setResult({
				success: false,
				message:
					error instanceof Error ? error.message : "Unknown error occurred",
				error,
			});
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button onClick={handleSyncProducts} disabled={loading}>
				{loading ? "Syncing..." : "Sync with Lemon Squeezy"}
			</Button>

			{result && (
				<Card className='mt-8'>
					<CardHeader>
						<CardTitle>Result</CardTitle>
					</CardHeader>
					<CardContent>
						<div className='bg-gray-100 p-4 rounded-md overflow-auto'>
							<pre className='text-sm'>{JSON.stringify(result, null, 2)}</pre>
						</div>
					</CardContent>
				</Card>
			)}
		</>
	);
}
