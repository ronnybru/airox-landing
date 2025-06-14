"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { H3, Paragraph } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function UserCredits() {
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [credits, setCredits] = useState<number | null>(null);

	useEffect(() => {
		async function fetchOrganizationCredits() {
			if (session?.user) {
				try {
					// Fetch the organization credits from the server
					const response = await fetch("/api/user/credits");
					if (!response.ok) {
						throw new Error("Failed to fetch organization credits");
					}
					const data = await response.json();
					setCredits(data.credits);
				} catch (error) {
					console.error("Error fetching organization credits:", error);
				} finally {
					setLoading(false);
				}
			}
		}

		if (!isPending) {
			if (session?.user) {
				fetchOrganizationCredits();
			} else {
				setLoading(false);
			}
		}
	}, [session, isPending]);

	if (loading || isPending) {
		return (
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Organization Credits</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='h-16 flex items-center'>
						<div className='w-16 h-4 bg-gray-200 rounded animate-pulse'></div>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!session?.user || credits === null) {
		return null;
	}

	return (
		<Card className='mb-6'>
			<CardHeader>
				<CardTitle>Organization Credits</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='flex flex-col md:flex-row justify-between items-start md:items-center'>
					<div>
						<H3 className='text-3xl font-bold mb-2'>{credits}</H3>
						<Paragraph className='text-gray-500'>
							Available credits for your organization
						</Paragraph>
					</div>
					<Button
						onClick={() => router.push("/membership")}
						className='mt-4 md:mt-0'>
						Get More Credits
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
