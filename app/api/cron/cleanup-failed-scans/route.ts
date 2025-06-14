import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bodyScans } from "@/lib/db/schema";
import { deleteFromS3 } from "@/lib/s3";
import { and, lt, inArray, eq } from "drizzle-orm";

/**
 * API route handler for the cleanup-failed-scans cron job
 * This job removes scans that are failed or stuck in pending/processing state for more than 15 minutes
 * It cleans up both the database records and associated S3 images
 */
export async function POST() {
	try {
		console.log("🧹 Starting scan cleanup job...");

		// Define cleanup threshold - 15 minutes for both failed and stuck scans
		const CLEANUP_RETENTION_MINUTES = 15;
		const BATCH_SIZE = 50; // Process scans in batches to avoid memory issues

		// Calculate the cutoff date (scans older than this will be deleted)
		const cutoffDate = new Date();
		cutoffDate.setMinutes(cutoffDate.getMinutes() - CLEANUP_RETENTION_MINUTES);

		console.log(
			`🕒 Cleaning up failed/stuck scans older than: ${cutoffDate.toISOString()}`
		);

		// Find scans that are either failed or stuck in pending/processing state
		const problematicScans = await db
			.select({
				id: bodyScans.id,
				imageUrl: bodyScans.imageUrl,
				userId: bodyScans.userId,
				analysisStatus: bodyScans.analysisStatus,
				createdAt: bodyScans.createdAt,
			})
			.from(bodyScans)
			.where(
				and(
					inArray(bodyScans.analysisStatus, [
						"failed",
						"pending",
						"processing",
					]),
					lt(bodyScans.createdAt, cutoffDate)
				)
			)
			.limit(BATCH_SIZE);

		if (problematicScans.length === 0) {
			console.log("✅ No problematic scans found for cleanup");
			return NextResponse.json({
				success: true,
				message: "No problematic scans found for cleanup",
				deletedCount: 0,
			});
		}

		console.log(
			`🔍 Found ${problematicScans.length} problematic scans to clean up`
		);

		let deletedCount = 0;
		let s3DeleteErrors = 0;
		let dbDeleteErrors = 0;
		const statusCounts = { failed: 0, pending: 0, processing: 0 };

		// Process each problematic scan
		for (const scan of problematicScans) {
			try {
				const ageMinutes = Math.round(
					(Date.now() - new Date(scan.createdAt).getTime()) / (1000 * 60)
				);
				console.log(
					`🔧 Processing scan: ${scan.id} (status: ${scan.analysisStatus}, age: ${ageMinutes} minutes)`
				);

				// Count by status for reporting
				statusCounts[scan.analysisStatus as keyof typeof statusCounts]++;

				// Delete the image from S3 first
				try {
					await deleteFromS3(scan.imageUrl);
					console.log(`🗑️ Deleted S3 image: ${scan.imageUrl}`);
				} catch (s3Error) {
					console.error(
						`❌ Failed to delete S3 image ${scan.imageUrl}:`,
						s3Error
					);
					s3DeleteErrors++;
					// Continue with database deletion even if S3 deletion fails
				}

				// Delete the scan from the database
				try {
					await db.delete(bodyScans).where(eq(bodyScans.id, scan.id));

					deletedCount++;
					console.log(
						`🗑️ Deleted ${scan.analysisStatus} scan: ${scan.id} (user: ${scan.userId})`
					);
				} catch (dbError) {
					console.error(
						`❌ Failed to delete scan ${scan.id} from database:`,
						dbError
					);
					dbDeleteErrors++;
				}
			} catch (error) {
				console.error(`❌ Error processing scan ${scan.id}:`, error);
			}
		}

		const summary = {
			success: true,
			message: `Cleanup completed. Deleted ${deletedCount} problematic scans.`,
			deletedCount,
			s3DeleteErrors,
			dbDeleteErrors,
			totalProcessed: problematicScans.length,
			statusBreakdown: statusCounts,
		};

		console.log("✅ Scan cleanup completed:", summary);

		// Log any errors for monitoring
		if (s3DeleteErrors > 0 || dbDeleteErrors > 0) {
			console.warn(
				`⚠️ Cleanup completed with errors: ${s3DeleteErrors} S3 errors, ${dbDeleteErrors} DB errors`
			);
		}

		return NextResponse.json(summary);
	} catch (error) {
		console.error("❌ Error in cleanup-failed-scans cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to cleanup problematic scans",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// Health check endpoint
export async function GET() {
	return NextResponse.json({
		status: "healthy",
		job: "cleanup-failed-scans",
		description: "Cleans up failed or stuck scans older than 15 minutes",
	});
}
