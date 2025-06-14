"use client";

import { useSession } from "@/lib/auth-client";
import { Paragraph } from "@/components/ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UserCredits from "./components/UserCredits";
import { PageHeader } from "@/components/page-header";

export default function Dashboard() {
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<div className='flex space-x-2'>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse'></div>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75'></div>
					<div className='w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150'></div>
				</div>
			</div>
		);
	}

	if (!session) {
		return null; // Will redirect in the useEffect
	}

	// Get username or email for greeting
	const username =
		session.user?.name || session.user?.email?.split("@")[0] || "User";

	// Get time of day for greeting
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	};

	// Create title and subtitle for the dashboard
	const title = `${getGreeting()}, ${username}! 👋`;
	const subtitle = "Here's what's happening with your account today";

	return (
		<>
			<PageHeader title={title} subtitle={subtitle} />

			{/* Display user credits */}
			<UserCredits />

			<div className='mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle>Split Testing</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph>
							Optimize your content and strategies with powerful split testing
							capabilities.
						</Paragraph>
						<Button className='mt-4' asChild>
							<Link href='#'>Manage Experiments</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Blog (MD)</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph>
							Create and manage your blog posts using Markdown for easy content
							creation.
						</Paragraph>
						<Button className='mt-4' asChild>
							<Link href='#'>Write New Post</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>AI Assistance</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph>
							Leverage AI to assist with content generation, analysis, and
							optimization.
						</Paragraph>
						<Button className='mt-4' asChild>
							<Link href='#'>Explore AI Tools</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Membership</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph>
							Upgrade your membership to get more credits and unlock premium
							features.
						</Paragraph>
						<Button className='mt-4' asChild>
							<Link href='/membership'>View Plans</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Admin</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph>
							Access administrative tools for managing memberships and system
							settings.
						</Paragraph>
						<Button className='mt-4' asChild>
							<Link href='/admin/memberships'>Manage Memberships</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className='lg:col-span-3'>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<Paragraph className='text-gray-500 italic'>
							No recent activity to display in this demo.
						</Paragraph>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
