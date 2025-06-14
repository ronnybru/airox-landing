"use server";

import { db } from "@/lib/db";
import { invitation as invitationTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { organization } from "@/lib/auth-client";
import { getServerSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Process a pending invitation after user signs in or creates an account
 * @param invitationId The ID of the invitation to process
 * @returns Object with success status and message
 */
export async function processInvitation(invitationId: string) {
	try {
		console.log(`Processing invitation: ${invitationId}`);

		// Get the current session to ensure the user is authenticated
		const session = await getServerSession();
		if (!session) {
			console.log(
				"No session found, trying to get session directly from auth API"
			);

			// Try to get the session directly from the auth API as a fallback
			try {
				const apiSession = await auth.api.getSession({
					headers: await headers(),
				});

				if (!apiSession) {
					console.error("No session found from auth API either");
					return {
						success: false,
						message: "Authentication required",
					};
				}

				console.log(`Got session from API for user: ${apiSession.user.email}`);
			} catch (sessionError) {
				console.error("Error getting session from auth API:", sessionError);
				return {
					success: false,
					message: "Authentication required",
				};
			}
		} else {
			console.log(`Processing with session for user: ${session.user.email}`);
		}

		// Fetch the invitation from the database
		const invitationData = await db.query.invitation.findFirst({
			where: eq(invitationTable.id, invitationId),
			with: {
				organization: true,
			},
		});

		// Check if the invitation exists
		if (!invitationData) {
			console.error(`Invitation not found: ${invitationId}`);
			return {
				success: false,
				message: "Invitation not found",
			};
		}

		console.log(
			`Found invitation for email: ${invitationData.email} to organization: ${invitationData.organization.name}`
		);

		// Check if the invitation is still pending
		if (invitationData.status !== "pending") {
			console.log(`Invitation status is not pending: ${invitationData.status}`);
			return {
				success: false,
				message: "Invitation has already been processed",
			};
		}

		// Check if the invitation is for the current user's email
		if (
			session &&
			invitationData.email.toLowerCase() !== session.user.email.toLowerCase()
		) {
			console.error(
				`Email mismatch: invitation for ${invitationData.email}, but session user is ${session.user.email}`
			);
			return {
				success: false,
				message: "This invitation is for a different email address",
			};
		}

		// Accept the invitation using the organization client
		console.log(`Accepting invitation ${invitationId}`);
		try {
			await organization.acceptInvitation({
				invitationId,
			});
			console.log(`Successfully accepted invitation ${invitationId}`);
		} catch (acceptError) {
			console.error("Error accepting invitation:", acceptError);

			// Try server-side acceptance as a fallback
			try {
				console.log("Trying server-side invitation acceptance");
				await auth.api.acceptInvitation({
					headers: await headers(),
					body: {
						invitationId,
					},
				});
				console.log("Server-side invitation acceptance successful");
			} catch (serverAcceptError) {
				console.error(
					"Server-side invitation acceptance failed:",
					serverAcceptError
				);
				throw serverAcceptError; // Re-throw to be caught by the outer catch
			}
		}

		// Set the organization as the active organization for the user
		try {
			const { setActiveOrganization } = await import("@/lib/session");
			await setActiveOrganization(invitationData.organizationId);
			console.log(
				`Set active organization to: ${invitationData.organization.name}`
			);
		} catch (setActiveError) {
			console.error("Error setting active organization:", setActiveError);
			// Continue even if setting active organization fails
		}

		return {
			success: true,
			message: `You have successfully joined ${invitationData.organization.name}`,
			organizationId: invitationData.organizationId,
			organizationName: invitationData.organization.name,
		};
	} catch (error) {
		console.error("Error processing invitation:", error);
		return {
			success: false,
			message: "Failed to process invitation",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
