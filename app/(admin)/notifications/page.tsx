import { H2, H4, Paragraph } from "@/components/ui/typography";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { NotificationForm } from "./components/notification-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationHistory } from "@/app/(admin)/notifications/components/notification-history";
import { checkAdminAccess } from "@/app/actions/user-helpers";
export const dynamic = "force-dynamic";

export default async function NotificationsAdminPage() {
	await checkAdminAccess();
	return (
		<div className='container mx-auto py-8'>
			<H2 className='mb-6'>Notification Management</H2>

			<Tabs defaultValue='send'>
				<TabsList className='mb-4'>
					<TabsTrigger value='send'>Send Notifications</TabsTrigger>
					<TabsTrigger value='history'>Notification History</TabsTrigger>
				</TabsList>

				<TabsContent value='send'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						<Card>
							<CardHeader>
								<CardTitle>Send Notification</CardTitle>
								<CardDescription>
									Send notifications to users, organizations, or system-wide
								</CardDescription>
							</CardHeader>
							<CardContent>
								<NotificationForm type='info' />
							</CardContent>
						</Card>

						<div className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Notification Types</CardTitle>
									<CardDescription>
										Different notification types and their uses
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div>
										<H4 className='text-sm font-semibold'>Info</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											General information notifications
										</Paragraph>
									</div>
									<div>
										<H4 className='text-sm font-semibold'>Success</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Positive action confirmations
										</Paragraph>
									</div>
									<div>
										<H4 className='text-sm font-semibold'>Warning</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Important alerts that need attention
										</Paragraph>
									</div>
									<div>
										<H4 className='text-sm font-semibold'>Error</H4>
										<Paragraph className='text-sm text-muted-foreground'>
											Critical issues that require immediate action
										</Paragraph>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Notification Best Practices</CardTitle>
								</CardHeader>
								<CardContent className='space-y-2'>
									<Paragraph className='text-sm'>
										• Keep notifications concise and clear
									</Paragraph>
									<Paragraph className='text-sm'>
										• Use appropriate notification types
									</Paragraph>
									<Paragraph className='text-sm'>
										• Avoid sending too many notifications
									</Paragraph>
									<Paragraph className='text-sm'>
										• Include actionable information when possible
									</Paragraph>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value='history'>
					<Card>
						<CardHeader>
							<CardTitle>Recent Notifications</CardTitle>
							<CardDescription>
								History of notifications sent to users
							</CardDescription>
						</CardHeader>
						<CardContent>
							<NotificationHistory />
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
