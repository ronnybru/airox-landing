import { H3, Paragraph } from "@/components/ui/typography";
import { requireServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export default async function ApiIntegrationsSettingsPage() {
	// Ensure user is authenticated
	await requireServerSession();

	return (
		<div>
			<H3>API & Integrations</H3>
			<div className='bg-card p-6 mt-4 rounded-lg border'>
				<Paragraph>
					This is where API and integration settings will be displayed. You will
					be able to manage API keys, webhooks, and third-party service
					integrations here.
				</Paragraph>
			</div>
		</div>
	);
}
