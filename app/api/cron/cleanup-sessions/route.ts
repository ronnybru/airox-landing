import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { lt } from "drizzle-orm";

/**
 * API route handler for the cleanup-sessions cron job
 * This job removes expired sessions from the database
 */
export async function POST(request: NextRequest) {
	try {
		// Verify the cron secret to ensure this is called by our cron service
		const cronSecret = request.headers.get("x-cron-secret");
		const expectedSecret = process.env.CRON_SECRET || "default-cron-secret";

		if (cronSecret !== expectedSecret) {
			console.error("Unauthorized cron job request: Invalid secret");
			return NextResponse.json(
				{ error: "Unauthorized: Invalid cron secret" },
				{ status: 401 }
			);
		}

		// Calculate the expiration timestamp (sessions older than this will be deleted)
		const now = new Date();
		const expirationTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

		// Delete expired sessions
		const result = await db
			.delete(session)
			.where(lt(session.expiresAt, expirationTime))
			.returning({ id: session.id });

		const deletedCount = result.length;

		console.log(`Cleaned up ${deletedCount} expired sessions`);

		return NextResponse.json({
			success: true,
			message: `Cleaned up ${deletedCount} expired sessions`,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in cleanup-sessions cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
