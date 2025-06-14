"use server";

import { scheduleWelcomeEmails } from "@/app/emails/welcome-emails";
import { getCurrentUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Define email variant type
type EmailVariant = "a" | "b";

/**
 * Server action to start the welcome email series for a user
 * This can be called when a user signs up or when you want to manually
 * trigger the welcome email series for a specific user
 *
 * @param userId - Optional user ID. If not provided, will use the current authenticated user
 * @param variant - Optional email variant to use. If not provided, will randomly assign a variant
 */
export async function startWelcomeEmailSeries(
	userId?: string,
	variant?: EmailVariant
) {
	try {
		// Get the user ID (either provided or from the current session)
		const targetUserId = userId || (await getCurrentUserId());

		if (!targetUserId) {
			throw new Error("No user ID provided and no authenticated user found");
		}

		// Fetch the user from the database
		const userData = await db.query.user.findFirst({
			where: eq(user.id, targetUserId),
		});

		if (!userData) {
			throw new Error(`User with ID ${targetUserId} not found`);
		}

		// Determine which variant to use
		// If no variant is provided, randomly assign one
		const emailVariant = variant || (Math.random() < 0.5 ? "a" : "b");

		// Store the assigned variant in the user record for tracking
		await db.update(user).set({ emailVariant }).where(eq(user.id, userData.id));

		// Schedule the welcome email series
		await scheduleWelcomeEmails(
			userData.id,
			userData.email,
			userData.name || "User",
			emailVariant,
			{
				// You can customize these URLs if needed
				dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
				featuresUrl: `${process.env.NEXT_PUBLIC_APP_URL}/features`,
				tutorialUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tutorial`,
				templatesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
				advancedGuideUrl: `${process.env.NEXT_PUBLIC_APP_URL}/advanced-guide`,
				unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?userId=${userData.id}`,
			}
		);

		return {
			success: true,
			message: "Welcome email series scheduled successfully",
		};
	} catch (error) {
		console.error("Error starting welcome email series:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Server action to send a specific welcome email to a user
 * This can be used for testing or to manually send a specific email
 *
 * @param emailType - The type of welcome email to send (day1, day3, or day7)
 * @param userId - Optional user ID. If not provided, will use the current authenticated user
 * @param variant - Optional email variant to use. If not provided, will use the user's assigned variant or default to "a"
 */
export async function sendSpecificWelcomeEmail(
	emailType: "day1" | "day3" | "day7",
	userId?: string,
	variant?: EmailVariant
) {
	try {
		// Get the user ID (either provided or from the current session)
		const targetUserId = userId || (await getCurrentUserId());

		if (!targetUserId) {
			throw new Error("No user ID provided and no authenticated user found");
		}

		// Fetch the user from the database
		const userData = await db.query.user.findFirst({
			where: eq(user.id, targetUserId),
		});

		if (!userData) {
			throw new Error(`User with ID ${targetUserId} not found`);
		}

		// Import the function dynamically to avoid circular dependencies
		const { sendWelcomeEmail } = await import("@/app/emails/welcome-emails");

		// Determine which variant to use
		// If variant is provided, use it
		// Otherwise, use the user's assigned variant or default to "a"
		let emailVariant = variant;
		if (!emailVariant) {
			emailVariant = (userData.emailVariant as EmailVariant) || "a";
		}

		// Send the specific welcome email
		await sendWelcomeEmail(
			userData.id,
			userData.email,
			userData.name || "User",
			emailType,
			emailVariant,
			{
				// You can customize these URLs if needed
				dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
				featuresUrl: `${process.env.NEXT_PUBLIC_APP_URL}/features`,
				tutorialUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tutorial`,
				templatesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
				advancedGuideUrl: `${process.env.NEXT_PUBLIC_APP_URL}/advanced-guide`,
				unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?userId=${userData.id}`,
			}
		);

		return {
			success: true,
			message: `Welcome email (${emailType}) sent successfully`,
		};
	} catch (error) {
		console.error(`Error sending welcome email (${emailType}):`, error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
