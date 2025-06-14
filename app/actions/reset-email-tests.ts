"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Reset all email variant assignments
 * This allows starting a new split test with fresh data
 */
export async function resetEmailTests() {
	try {
		// Set emailVariant to null for all users
		await db
			.update(user)
			.set({ emailVariant: null })
			.where(sql`${user.emailVariant} is not null`);

		return {
			success: true,
			message: "Email test data has been reset successfully",
		};
	} catch (error) {
		console.error("Error resetting email tests:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
