"use server";

import { syncPlans } from "./membership";

/**
 * Initialize memberships and sync with Lemon Squeezy
 * This function can be called from a server component or admin page
 */
export async function initMemberships() {
	try {
		// Sync plans from Lemon Squeezy
		const plans = await syncPlans();

		return {
			success: true,
			message: `Successfully synced ${plans.length} plans from Lemon Squeezy`,
			plans,
		};
	} catch (error) {
		console.error("Error initializing memberships:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
			error,
		};
	}
}
