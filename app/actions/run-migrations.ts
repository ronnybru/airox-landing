"use server";

import { db } from "@/lib/db";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/**
 * Run database migrations
 * This action should be called by an admin to apply new migrations
 */
export async function runMigrations() {
	try {
		// Run migrations
		await migrate(db, { migrationsFolder: "drizzle/migrations" });
		return { success: true, message: "Migrations applied successfully" };
	} catch (error) {
		console.error("Error running migrations:", error);
		return {
			success: false,
			message: "Failed to apply migrations",
			error: error instanceof Error ? error.message : String(error),
		};
	}
}
