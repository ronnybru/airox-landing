import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyScans, user } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import {
	analyzeBodyScanImage,
	convertAnalysisToDbFormat,
} from "@/lib/ai-analysis";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: NextRequest) {
	let requestBody: { scanId?: string; imageUrl?: string } = {};

	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		requestBody = await request.json();
		const { scanId, imageUrl } = requestBody;

		if (!scanId || !imageUrl) {
			return NextResponse.json(
				{ error: "Scan ID or image URL is required" },
				{ status: 400 }
			);
		}

		// Find the scan and user's height
		const [scanData] = await db
			.select({
				scan: bodyScans,
				userHeight: user.height,
			})
			.from(bodyScans)
			.leftJoin(user, eq(bodyScans.userId, user.id))
			.where(eq(bodyScans.id, scanId))
			.limit(1);

		if (!scanData || scanData.scan.userId !== session.user.id) {
			return NextResponse.json({ error: "Scan not found" }, { status: 404 });
		}

		const { userHeight } = scanData;

		// Update status to processing
		await db
			.update(bodyScans)
			.set({
				analysisStatus: "processing",
				updatedAt: new Date(),
			})
			.where(eq(bodyScans.id, scanId));

		// Perform AI analysis with user's height if available
		console.log(
			"Starting AI analysis for scan:",
			scanId,
			userHeight ? `with height: ${userHeight}cm` : "without height data"
		);
		const aiAnalysis = await analyzeBodyScanImage(
			imageUrl,
			userHeight || undefined
		);
		console.log("AI analysis completed for scan:", scanId);

		// Convert AI analysis to database format
		const dbAnalysis = convertAnalysisToDbFormat(aiAnalysis);

		// Determine if this should be marked as a baseline scan (first successful scan of the day)
		let isBaseline = scanData.scan.isBaseline;

		if (!isBaseline) {
			// Get user's timezone for accurate daily calculation
			const userData = await db
				.select({ timezone: user.timezone })
				.from(user)
				.where(eq(user.id, session.user.id))
				.limit(1);

			const userTimezone = userData[0]?.timezone || "UTC";

			// Calculate today's date range in user's timezone
			const now = new Date();
			const userDate = new Date(
				now.toLocaleString("en-US", { timeZone: userTimezone })
			);

			// Get start of day in user's timezone
			const startOfDay = new Date(
				userDate.getFullYear(),
				userDate.getMonth(),
				userDate.getDate()
			);

			// Get end of day in user's timezone
			const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

			// Convert to UTC for database query (since createdAt is stored in UTC)
			const timezoneOffsetMs =
				startOfDay.getTime() - new Date(startOfDay.toISOString()).getTime();
			const todayStartUTC = new Date(startOfDay.getTime() - timezoneOffsetMs);
			const todayEndUTC = new Date(endOfDay.getTime() - timezoneOffsetMs);

			// Check for any completed scans today in user's timezone
			const completedTodayScans = await db
				.select()
				.from(bodyScans)
				.where(
					and(
						eq(bodyScans.userId, session.user.id),
						eq(bodyScans.analysisStatus, "completed"),
						gte(bodyScans.createdAt, todayStartUTC),
						lt(bodyScans.createdAt, todayEndUTC)
					)
				);

			// If no completed scans today and this one is now complete, mark as baseline
			if (completedTodayScans.length === 0) {
				isBaseline = true;
			}
		}

		// Update scan with analysis results
		const [updatedScan] = await db
			.update(bodyScans)
			.set({
				analysisStatus: "completed",
				analysisResults: dbAnalysis.analysisResults,
				bodyFatPercentage: dbAnalysis.bodyFatPercentage,
				muscleMass: dbAnalysis.muscleMass,
				visceralFat: dbAnalysis.visceralFat,
				progressScore: dbAnalysis.progressScore,
				transformationRating: dbAnalysis.transformationRating,
				jackScore: dbAnalysis.jackScore,
				isBaseline: isBaseline,
				updatedAt: new Date(),
			})
			.where(eq(bodyScans.id, scanId))
			.returning();

		return NextResponse.json({
			success: true,
			bodyScan: {
				id: updatedScan.id,
				analysisStatus: updatedScan.analysisStatus,
				analysisResults: updatedScan.analysisResults,
				bodyFatPercentage: updatedScan.bodyFatPercentage
					? updatedScan.bodyFatPercentage / 100
					: null,
				muscleMass: updatedScan.muscleMass
					? updatedScan.muscleMass / 1000
					: null,
				visceralFat: updatedScan.visceralFat,
				progressScore: updatedScan.progressScore,
				transformationRating: updatedScan.transformationRating,
				jackScore: updatedScan.jackScore,
			},
		});
	} catch (error) {
		console.error("Error analyzing body scan:", error);

		// Update scan status to failed if there was an error
		if (requestBody.scanId) {
			try {
				await db
					.update(bodyScans)
					.set({
						analysisStatus: "failed",
						analysisError:
							error instanceof Error
								? error.message
								: "Analysis failed due to server error",
						updatedAt: new Date(),
					})
					.where(eq(bodyScans.id, requestBody.scanId!));
			} catch (updateError) {
				console.error("Error updating scan status:", updateError);
			}
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
