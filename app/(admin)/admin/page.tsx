import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import { checkAdminAccess } from "@/app/actions/user-helpers";

export const dynamic = "force-dynamic";

async function getAdminStats() {
	// Get total users count
	const [userCount] = await db.select({ count: count() }).from(schema.user);

	// Get total organizations count
	const [orgCount] = await db
		.select({ count: count() })
		.from(schema.organization);

	// Get total active memberships count
	const [membershipCount] = await db
		.select({ count: count() })
		.from(schema.organizationMemberships)
		.where(eq(schema.organizationMemberships.status, "active"));

	// Get total notifications count
	const [notificationCount] = await db
		.select({ count: count() })
		.from(schema.notifications);

	// Get total exercises count
	const [exerciseCount] = await db
		.select({ count: count() })
		.from(schema.exercises);

	// Get total workout sessions count
	const [sessionCount] = await db
		.select({ count: count() })
		.from(schema.workoutSessions);

	return {
		userCount: userCount?.count || 0,
		orgCount: orgCount?.count || 0,
		membershipCount: membershipCount?.count || 0,
		notificationCount: notificationCount?.count || 0,
		exerciseCount: exerciseCount?.count || 0,
		sessionCount: sessionCount?.count || 0,
	};
}

export default async function AdminDashboardPage() {
	// Check admin access before rendering the page
	await checkAdminAccess();

	const stats = await getAdminStats();

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<PageHeader
					title='Admin Dashboard'
					subtitle='Overview of system statistics and admin tools'
				/>
				<Button asChild>
					<Link href='/dashboard'>Go to User Dashboard</Link>
				</Button>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Users</CardTitle>
						<CardDescription>Total registered users</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.userCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/users'>Manage Users</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Organizations</CardTitle>
						<CardDescription>Total organizations</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.orgCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/organizations'>Manage Organizations</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Memberships</CardTitle>
						<CardDescription>Active memberships</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.membershipCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/memberships'>Manage Memberships</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Notifications</CardTitle>
						<CardDescription>System notifications</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.notificationCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/notifications'>Manage Notifications</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Exercises</CardTitle>
						<CardDescription>Total exercises in system</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.exerciseCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/exercises'>Manage Exercises</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardTitle className='text-2xl'>Workout Sessions</CardTitle>
						<CardDescription>Total workout sessions</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-4xl font-bold'>{stats.sessionCount}</p>
						<div className='mt-2'>
							<Button variant='outline' size='sm' asChild>
								<Link href='/workouts'>View Sessions</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<Card>
					<CardHeader>
						<CardTitle>Admin Tools</CardTitle>
						<CardDescription>Quick access to admin tools</CardDescription>
					</CardHeader>
					<CardContent className='grid grid-cols-2 gap-2'>
						<Button variant='outline' asChild>
							<Link href='/exercises'>Exercise Management</Link>
						</Button>
						<Button variant='outline' asChild>
							<Link href='/email-tests'>Email Tests</Link>
						</Button>
						<Button variant='outline' asChild>
							<Link href='/queues'>Queue Management</Link>
						</Button>
						<Button variant='outline' asChild>
							<Link href='/notifications'>Send Notifications</Link>
						</Button>
						<Button variant='outline' asChild>
							<Link href='/memberships'>Membership Management</Link>
						</Button>
						<Button variant='outline' asChild>
							<Link href='/workouts'>Workout Sessions</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Status</CardTitle>
						<CardDescription>Current system status and health</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-2'>
							<div className='flex justify-between items-center'>
								<span>API Status</span>
								<span className='inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
									Operational
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span>Database</span>
								<span className='inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
									Healthy
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span>Email Service</span>
								<span className='inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
									Operational
								</span>
							</div>
							<div className='flex justify-between items-center'>
								<span>Payment Processing</span>
								<span className='inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
									Operational
								</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
