import { db } from "@/lib/db";
import { invitation as invitationTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcceptInvitationClient } from "./accept-invitation-client";

// Server component to fetch invitation data
export default async function AcceptInvitationPage({
	params,
}: {
	params: Promise<{ invitationId: string }>;
}) {
	// Fetch invitation data directly from the database
	try {
		// In Next.js 15, we need to await the params object
		const { invitationId } = await params;

		const invitationData = await db.query.invitation.findFirst({
			where: eq(invitationTable.id, invitationId),
			with: {
				organization: true,
				inviter: true,
			},
		});

		if (!invitationData) {
			// If invitation not found, redirect to an error page
			return redirect("/invitations/not-found");
		}

		if (invitationData.status !== "pending") {
			// If invitation is not pending, redirect to an appropriate page
			return redirect("/invitations/already-processed");
		}

		// Pass the invitation data to the client component
		return <AcceptInvitationClient invitation={invitationData} />;
	} catch (error) {
		console.error("Error fetching invitation:", error);
		return redirect("/invitations/error");
	}
}
