import { H2, H4, Paragraph } from "@/components/ui/typography";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PushNotificationForm } from "./components/push-notification-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { checkAdminAccess } from "@/app/actions/user-helpers";
import { PushNotificationHistory } from "./components/push-notification-history";
export const dynamic = "force-dynamic";

export default async function PushNotificationsAdminPage() {
	await checkAdminAccess();
	return (
		<div className='container mx-auto py-8'>
			<H2 className='mb-6'>Push Notification Management</H2>

			<Tabs defaultValue='send'>
				<TabsList className='mb-4'>
					<TabsTrigger value='send'>Send Push Notifications</TabsTrigger>
					<TabsTrigger value='history'>Campaign History</TabsTrigger>
				</TabsList>

				<TabsContent value='send'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle>Send Push Notification</CardTitle>
								<CardDescription>
									Send push notifications to mobile app users
								</CardDescription>
							</CardHeader>
							<CardContent>
								<PushNotificationForm />
							</CardContent>
						</Card>

						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Targeting Options</CardTitle>
									<CardDescription>
										Different ways to target your push notifications
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<H4 className='text-sm font-semibold'>
											Send to Everyone Now
										</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Immediately send to all users with push notifications
											enabled
										</Paragraph>
									</div>
									<div>
										<H4 className='text-sm font-semibold'>
											Send at Local Time
										</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Schedule notifications to be sent at a specific time in
											each user&apos;s timezone
										</Paragraph>
									</div>
									<div>
										<H4 className='text-sm font-semibold'>
											Send to Specific User
										</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Target a specific user by their user ID
										</Paragraph>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Push Notification Best Practices</CardTitle>
								</CardHeader>
								<CardContent className='space-y-2'>
									<Paragraph className='text-sm'>
										• Keep titles under 50 characters for better visibility
									</Paragraph>
									<Paragraph className='text-sm'>
										• Write clear, actionable messages under 150 characters
									</Paragraph>
									<Paragraph className='text-sm'>
										• Consider user timezones for better engagement
									</Paragraph>
									<Paragraph className='text-sm'>
										• Test with a single user before sending to everyone
									</Paragraph>
									<Paragraph className='text-sm'>
										• Avoid sending too many notifications to prevent opt-outs
									</Paragraph>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='history'>
					<Card>
						<CardHeader>
							<CardTitle>Push Notification Campaigns</CardTitle>
							<CardDescription>
								History of push notification campaigns and their delivery status
							</CardDescription>
						</CardHeader>
						<CardContent>
							<PushNotificationHistory />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
