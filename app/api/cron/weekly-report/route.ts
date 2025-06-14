import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { count, gte } from "drizzle-orm";

/**
 * API route handler for the weekly-report cron job
 * This job generates a weekly report of user activity
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

		// Calculate date range for the report (last 7 days)
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		// Get total user count
		const totalUsersResult = await db.select({ value: count() }).from(user);
		const totalUsers = totalUsersResult[0]?.value || 0;

		// Get new users in the last week
		const newUsersResult = await db
			.select({ value: count() })
			.from(user)
			.where(gte(user.createdAt, oneWeekAgo));

		const newUsers = newUsersResult[0]?.value || 0;

		// Generate the report
		const report = {
			generatedAt: now.toISOString(),
			period: {
				start: oneWeekAgo.toISOString(),
				end: now.toISOString(),
			},
			metrics: {
				totalUsers,
				newUsers,
				// Add more metrics as needed
			},
		};

		// In a real application, you might:
		// 1. Store the report in the database
		// 2. Send the report via email to administrators
		// 3. Generate visualizations or PDF reports

		console.log(`Weekly report generated: ${JSON.stringify(report)}`);

		return NextResponse.json({
			success: true,
			message: "Weekly report generated successfully",
			report,
			timestamp: now.toISOString(),
		});
	} catch (error) {
		console.error("Error in weekly-report cron job:", error);

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
