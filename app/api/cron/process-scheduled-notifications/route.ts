import { NextRequest, NextResponse } from "next/server";
import { processPendingNotifications } from "@/lib/scheduled-notifications";

export async function GET(request: NextRequest) {
	try {
		// Verify this is a cron request (optional security check)
		const cronSecret = request.headers.get("x-cron-secret");
		if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Processing scheduled notifications...");
		await processPendingNotifications();
		console.log("Scheduled notifications processed successfully");

		return NextResponse.json({
			success: true,
			message: "Scheduled notifications processed successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error processing scheduled notifications:", error);
		return NextResponse.json(
			{
				error: "Failed to process scheduled notifications",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const cronSecret = request.headers.get("x-cron-secret");
		if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("Processing scheduled notifications...");
		await processPendingNotifications();
		console.log("Scheduled notifications processed successfully");

		return NextResponse.json({
			success: true,
			message: "Scheduled notifications processed successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error processing scheduled notifications:", error);
		return NextResponse.json(
			{
				error: "Failed to process scheduled notifications",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
