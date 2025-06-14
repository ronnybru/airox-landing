import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyScans } from "@/lib/db/schema";
import { getImageUrl, deleteFromS3 } from "@/lib/s3";
import { eq, and } from "drizzle-orm";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ scanId: string }> }
) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { scanId } = await params;

		if (!scanId) {
			return NextResponse.json(
				{ error: "Scan ID is required" },
				{ status: 400 }
			);
		}

		// Fetch the specific body scan
		const [bodyScan] = await db
			.select({
				id: bodyScans.id,
				imageUrl: bodyScans.imageUrl,
				analysisStatus: bodyScans.analysisStatus,
				analysisResults: bodyScans.analysisResults,
				bodyFatPercentage: bodyScans.bodyFatPercentage,
				muscleMass: bodyScans.muscleMass,
				visceralFat: bodyScans.visceralFat,
				weight: bodyScans.weight,
				jackScore: bodyScans.jackScore,
				notes: bodyScans.notes,
				tags: bodyScans.tags,
				isBaseline: bodyScans.isBaseline,
				isPublic: bodyScans.isPublic,
				createdAt: bodyScans.createdAt,
			})
			.from(bodyScans)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			)
			.limit(1);

		if (!bodyScan) {
			return NextResponse.json({ error: "Scan not found" }, { status: 404 });
		}

		// Generate signed URL for the image
		const imageUrl = await getImageUrl(
			bodyScan.imageUrl,
			bodyScan.isPublic || false
		);

		// Convert weights back to kg for response
		const formattedScan = {
			...bodyScan,
			imageUrl: imageUrl, // Return signed URL instead of S3 key
			weight: bodyScan.weight ? bodyScan.weight / 1000 : null,
			bodyFatPercentage: bodyScan.bodyFatPercentage
				? bodyScan.bodyFatPercentage / 100
				: null,
			muscleMass: bodyScan.muscleMass ? bodyScan.muscleMass / 1000 : null,
			jackScore: bodyScan.jackScore, // Jack Score is already in the correct format (0-1000)
		};

		return NextResponse.json({
			success: true,
			bodyScan: formattedScan,
		});
	} catch (error) {
		console.error("Error fetching body scan:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ scanId: string }> }
) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { scanId } = await params;

		if (!scanId) {
			return NextResponse.json(
				{ error: "Scan ID is required" },
				{ status: 400 }
			);
		}

		// First, fetch the scan to get the image URL and verify ownership
		const [bodyScan] = await db
			.select({
				id: bodyScans.id,
				imageUrl: bodyScans.imageUrl,
				userId: bodyScans.userId,
			})
			.from(bodyScans)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			)
			.limit(1);

		if (!bodyScan) {
			return NextResponse.json({ error: "Scan not found" }, { status: 404 });
		}

		// Delete the image from S3
		try {
			await deleteFromS3(bodyScan.imageUrl);
		} catch (error) {
			console.error("Error deleting image from S3:", error);
			// Continue with database deletion even if S3 deletion fails
		}

		// Delete the scan from the database
		await db
			.delete(bodyScans)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			);

		return NextResponse.json({
			success: true,
			message: "Scan deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting body scan:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ scanId: string }> }
) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { scanId } = await params;

		if (!scanId) {
			return NextResponse.json(
				{ error: "Scan ID is required" },
				{ status: 400 }
			);
		}

		// Parse request body
		const body = await request.json();
		const { notes, tags, weight } = body;

		// Validate that at least one field is being updated
		if (notes === undefined && tags === undefined && weight === undefined) {
			return NextResponse.json(
				{ error: "At least one field (notes, tags, weight) must be provided" },
				{ status: 400 }
			);
		}

		// First, verify the scan exists and belongs to the user
		const [existingScan] = await db
			.select({
				id: bodyScans.id,
				userId: bodyScans.userId,
			})
			.from(bodyScans)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			)
			.limit(1);

		if (!existingScan) {
			return NextResponse.json({ error: "Scan not found" }, { status: 404 });
		}

		// Prepare update object
		const updateData: {
			notes?: string | null;
			tags?: string[] | null;
			weight?: number | null;
		} = {};

		if (notes !== undefined) {
			updateData.notes = notes;
		}

		if (tags !== undefined) {
			updateData.tags = tags;
		}

		if (weight !== undefined) {
			// Convert weight from kg to grams for storage
			updateData.weight = weight ? Math.round(weight * 1000) : null;
		}

		// Update the scan
		await db
			.update(bodyScans)
			.set(updateData)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			);

		return NextResponse.json({
			success: true,
			message: "Scan updated successfully",
		});
	} catch (error) {
		console.error("Error updating body scan:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
