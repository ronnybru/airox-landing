import { H3, Paragraph } from "@/components/ui/typography";
import { requireServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NotificationsSettingsPage() {
	// Ensure user is authenticated
	await requireServerSession();

	return (
		<div>
			<H3>Notifications</H3>
			<div className='bg-card p-6 mt-4 rounded-lg border'>
				<Paragraph>
					This is where notification settings will be displayed. You will be
					able to manage your notification preferences, email alerts, and
					communication settings here.
				</Paragraph>
			</div>
		</div>
	);
}
