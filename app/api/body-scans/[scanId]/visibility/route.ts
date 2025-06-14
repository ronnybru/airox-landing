import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyScans } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { makeImagePublic, makeImagePrivate } from "@/lib/s3";

export async function POST(
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
		const body = await request.json();
		const { isPublic } = body;

		if (typeof isPublic !== "boolean") {
			return NextResponse.json(
				{ error: "isPublic must be a boolean value" },
				{ status: 400 }
			);
		}

		// Verify the scan belongs to the authenticated user and get the image URL
		const [existingScan] = await db
			.select({
				id: bodyScans.id,
				userId: bodyScans.userId,
				imageUrl: bodyScans.imageUrl,
				isPublic: bodyScans.isPublic,
			})
			.from(bodyScans)
			.where(
				and(eq(bodyScans.id, scanId), eq(bodyScans.userId, session.user.id))
			)
			.limit(1);

		if (!existingScan) {
			return NextResponse.json(
				{ error: "Scan not found or access denied" },
				{ status: 404 }
			);
		}

		// Update S3 ACL if visibility is changing
		if (existingScan.isPublic !== isPublic) {
			try {
				if (isPublic) {
					await makeImagePublic(existingScan.imageUrl);
				} else {
					await makeImagePrivate(existingScan.imageUrl);
				}
			} catch (s3Error) {
				console.error("Error updating S3 ACL:", s3Error);
				return NextResponse.json(
					{ error: "Failed to update image visibility" },
					{ status: 500 }
				);
			}
		}

		// Update scan visibility in database
		const [updatedScan] = await db
			.update(bodyScans)
			.set({
				isPublic: isPublic,
				updatedAt: new Date(),
			})
			.where(eq(bodyScans.id, scanId))
			.returning({
				id: bodyScans.id,
				isPublic: bodyScans.isPublic,
				imageUrl: bodyScans.imageUrl,
				progressScore: bodyScans.progressScore,
				transformationRating: bodyScans.transformationRating,
				createdAt: bodyScans.createdAt,
			});

		return NextResponse.json({
			success: true,
			scan: updatedScan,
		});
	} catch (error) {
		console.error("Error updating scan visibility:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
