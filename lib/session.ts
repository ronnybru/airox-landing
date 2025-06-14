import { auth } from "./auth";
import { headers } from "next/headers";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "./db/schema";

/**
 * Get the current user session in server components or server actions
 * @returns The session object or null if not authenticated
 */
export async function getServerSession() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		return session;
	} catch (error) {
		console.error("Error fetching session:", error);
		return null;
	}
}

/**
 * Get the current user session and throw an error if not authenticated
 * Useful for protected routes or actions that require authentication
 * @returns The session object
 * @throws Error if not authenticated
 */
export async function requireServerSession() {
	const session = await getServerSession();

	if (!session) {
		throw new Error("Authentication required");
	}

	return session;
}

/**
 * Get the current user ID from the session
 * @returns The user ID or null if not authenticated
 */
export async function getCurrentUserId() {
	const session = await getServerSession();
	return session?.user?.id || null;
}

/**
 * Get the active organization from the session
 * @returns The active organization or null if not set
 */
export async function getActiveOrganization() {
	const session = await getServerSession();
	const userId = session?.user?.id;

	if (!userId) {
		return null;
	}

	try {
		// Get the session record from the database to access activeOrganizationId
		const sessionRecord = await db.query.session.findFirst({
			where: eq(schema.session.userId, userId),
			orderBy: (session, { desc }) => [desc(session.createdAt)],
		});

		if (!sessionRecord?.activeOrganizationId) {
			return null;
		}

		const organization = await db.query.organization.findFirst({
			where: eq(schema.organization.id, sessionRecord.activeOrganizationId),
			with: {
				members: {
					// Include user details with each member
					with: {
						user: {
							columns: {
								name: true,
								email: true,
								image: true,
							},
						},
					},
				},
			},
		});

		return organization;
	} catch (error) {
		console.error("Error fetching active organization:", error);
		return null;
	}
}

/**
 * Get the user's organizations
 * @returns Array of organizations the user is a member of
 */
export async function getUserOrganizations() {
	const userId = await getCurrentUserId();

	if (!userId) {
		return [];
	}

	try {
		const members = await db.query.member.findMany({
			where: eq(schema.member.userId, userId),
			with: {
				organization: true,
			},
		});

		return members.map((member) => ({
			...member.organization,
			role: member.role,
		}));
	} catch (error) {
		console.error("Error fetching user organizations:", error);
		return [];
	}
}

/**
 * Set the active organization for the current session
 * This is a server-side helper that updates the session record directly
 * @param organizationId The ID of the organization to set as active
 * @returns True if successful, false otherwise
 */
export async function setActiveOrganization(organizationId: string) {
	const session = await getServerSession();

	if (!session?.user?.id) {
		return false;
	}

	try {
		// Update the session record in the database
		await db
			.update(schema.session)
			.set({ activeOrganizationId: organizationId })
			.where(eq(schema.session.userId, session.user.id));

		return true;
	} catch (error) {
		console.error("Error setting active organization:", error);
		return false;
	}
}
