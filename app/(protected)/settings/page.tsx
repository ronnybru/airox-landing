import { H3 } from "@/components/ui/typography";
import {
	requireServerSession,
	getUserOrganizations,
	getActiveOrganization,
} from "@/lib/session";
import { checkUserHasCredentialAccount } from "@/app/actions/user-settings";
import ProfileSection from "./components/profile-section";
import EmailSection from "./components/email-section";
import PasswordSection from "./components/password-section";
import DangerZoneSection from "./components/danger-zone-section";
import AccountInfoBox from "./components/account-info-box";
import { db } from "@/lib/db";
import { user as userSchema } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
	// Ensure user is authenticated
	const session = await requireServerSession();

	// Check if user has a credential account
	const { hasCredentialAccount } = await checkUserHasCredentialAccount();

	// Get user's organizations
	const organizations = await getUserOrganizations();

	// Get active organization
	const activeOrganization = await getActiveOrganization();

	// Get additional user information from the database
	const userDetails = await db.query.user.findFirst({
		where: eq(userSchema.id, session.user.id),
	});

	return (
		<>
			<H3>Account Settings</H3>

			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6'>
				<div className='md:col-span-2 space-y-8'>
					{/* Profile Information */}
					<ProfileSection user={session.user} />

					{/* Email Management */}
					<EmailSection email={session.user.email} />

					{/* Password Management - only show if user has a credential account */}
					<PasswordSection hasCredentialAccount={hasCredentialAccount} />

					{/* Danger Zone */}
					<DangerZoneSection />
				</div>

				{/* Account Information Box */}
				<div className='md:col-span-1'>
					<AccountInfoBox
						user={{
							id: session.user.id,
							name: session.user.name,
							email: session.user.email,
							image: session.user.image,
							emailVerified: userDetails?.emailVerified || false,
							createdAt: userDetails?.createdAt || new Date(),
							role: userDetails?.role || "user",
						}}
						organizations={organizations}
						activeOrganization={activeOrganization}
					/>
				</div>
			</div>
		</>
	);
}
