import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { bodyScans } from "@/lib/db/schema";
import {
	uploadToS3,
	generateFileKey,
	validateImageFile,
	getImageUrl,
} from "@/lib/s3";
import { nanoid } from "nanoid";
import { eq, desc } from "drizzle-orm";
import sharp from "sharp";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		console.log("🔍 [Body Scans API] Checking authentication...");
		console.log(
			"🔍 [Body Scans API] Request headers:",
			Object.fromEntries(request.headers.entries())
		);

		const session = await auth.api.getSession({
			headers: request.headers,
		});

		console.log("🔍 [Body Scans API] Session result:", {
			hasSession: !!session,
			hasUser: !!session?.user,
			userId: session?.user?.id,
			userEmail: session?.user?.email,
		});

		if (!session?.user) {
			console.log("🚨 [Body Scans API] No valid session - returning 401");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("✅ [Body Scans API] Authentication successful");

		// Parse form data
		const formData = await request.formData();
		const file = formData.get("image") as File;
		const notes = formData.get("notes") as string;
		const weight = formData.get("weight") as string;
		const tagsString = formData.get("tags") as string;
		const isBaseline = formData.get("isBaseline") === "true";

		// Parse tags
		let tags: string[] = [];
		if (tagsString) {
			try {
				tags = JSON.parse(tagsString);
			} catch (error) {
				console.error("Error parsing tags:", error);
				tags = [];
			}
		}

		// We'll determine baseline status after successful analysis
		// This ensures failed scans aren't marked as baseline
		// See analyze/route.ts for the baseline determination logic

		if (!file) {
			return NextResponse.json(
				{ error: "No image file provided" },
				{ status: 400 }
			);
		}

		// Validate file
		const validation = validateImageFile({
			mimetype: file.type,
			size: file.size,
		});

		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		// Convert file to buffer
		const originalBuffer = Buffer.from(await file.arrayBuffer());

		// Generate unique file key for original image
		const originalFileKey = generateFileKey(
			session.user.id,
			file.name,
			"originals"
		);

		// Upload original image to S3 immediately (fast)
		const uploadResult = await uploadToS3(
			originalBuffer,
			originalFileKey,
			file.type,
			{
				userId: session.user.id,
				originalName: file.name,
				uploadedAt: new Date().toISOString(),
				processingStatus: "pending",
			}
		);

		// Save to database with original image details
		const bodyScanId = nanoid();
		const [bodyScan] = await db
			.insert(bodyScans)
			.values({
				id: bodyScanId,
				userId: session.user.id,
				imageUrl: uploadResult.key, // Store original S3 key initially
				originalFileName: file.name,
				fileSize: file.size, // Original file size
				mimeType: file.type, // Original MIME type
				analysisStatus: "pending",
				weight: weight ? parseInt(weight) * 1000 : null, // Convert kg to grams
				notes: notes || null,
				tags: tags.length > 0 ? tags : null,
				isBaseline: isBaseline,
				isPublic: false, // Default to private
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		// Generate signed URL for the uploaded image
		const imageUrl = await getImageUrl(
			bodyScan.imageUrl,
			bodyScan.isPublic || false,
			7200 // 2 hours for AI analysis
		);

		// Trigger AI analysis in the background
		// Don't await this - let it run asynchronously
		fetch(
			`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/body-scans/analyze`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Cookie: request.headers.get("cookie") || "",
				},
				body: JSON.stringify({
					scanId: bodyScanId,
					imageUrl: imageUrl,
				}),
			}
		).catch((error) => {
			console.error("Error triggering AI analysis:", error);
		});

		// Prepare response with original image URL
		const response = NextResponse.json({
			success: true,
			bodyScan: {
				id: bodyScan.id,
				imageUrl: imageUrl, // Return the signed URL instead of S3 key
				analysisStatus: bodyScan.analysisStatus,
				createdAt: bodyScan.createdAt,
				notes: bodyScan.notes,
				weight: bodyScan.weight ? bodyScan.weight / 1000 : null, // Convert back to kg
				isBaseline: bodyScan.isBaseline,
				optimizationStatus: "processing", // Indicate that optimization is happening
			},
		});

		// Process image in the background (non-blocking)
		setTimeout(async () => {
			try {
				console.log(
					`⚙️ [Background Processing] Starting image optimization for scan ${bodyScanId}...`
				);
				const MAX_IMAGE_WIDTH = 1920;
				const IMAGE_QUALITY = 85; // Good WebP quality - leverages WebP's superior compression

				// Process the image with Sharp
				const sharpInstance = sharp(originalBuffer)
					.resize({
						width: MAX_IMAGE_WIDTH,
						fit: sharp.fit.inside, // Maintain aspect ratio
						withoutEnlargement: true, // Don't enlarge if smaller than MAX_IMAGE_WIDTH
					})
					.webp({ quality: IMAGE_QUALITY });

				const { data: processedBuffer, info } = await sharpInstance.toBuffer({
					resolveWithObject: true,
				});

				// Generate processed filename with .webp extension
				const originalNameParts = file.name.split(".");
				originalNameParts.pop(); // remove original extension
				const processedFileName = originalNameParts.join(".") + ".webp";
				const processedFileKey = generateFileKey(
					session.user.id,
					processedFileName
				);

				// Upload processed image to S3
				await uploadToS3(processedBuffer, processedFileKey, "image/webp", {
					userId: session.user.id,
					originalName: file.name,
					processedName: processedFileName,
					uploadedAt: new Date().toISOString(),
					processingStatus: "completed",
				});

				// Update database record with processed image info
				await db
					.update(bodyScans)
					.set({
						imageUrl: processedFileKey, // Update to the optimized image key
						fileSize: info.size, // Update to processed file size
						mimeType: "image/webp", // Update to WebP MIME type
						updatedAt: new Date(),
					})
					.where(eq(bodyScans.id, bodyScanId));

				console.log(
					`✅ [Background Processing] Image optimization completed for scan ${bodyScanId}. New size: ${Math.round(info.size / 1024)}KB`
				);
			} catch (error) {
				console.error(
					`🚨 [Background Processing] Error optimizing image for scan ${bodyScanId}:`,
					error
				);
				// Keep the original image in place if optimization fails
			}
		}, 0); // Use setTimeout with 0ms to execute after the current call stack is complete

		return response;
	} catch (error) {
		console.error("Error uploading body scan:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Get user's body scans
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			console.log("🚨 [Body Scans GET API] No valid session - returning 401");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("✅ [Body Scans GET API] Authentication successful");

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = parseInt(searchParams.get("offset") || "0");

		// Fetch user's body scans
		const userBodyScans = await db
			.select({
				id: bodyScans.id,
				imageUrl: bodyScans.imageUrl,
				analysisStatus: bodyScans.analysisStatus,
				analysisResults: bodyScans.analysisResults,
				bodyFatPercentage: bodyScans.bodyFatPercentage,
				muscleMass: bodyScans.muscleMass,
				visceralFat: bodyScans.visceralFat,
				weight: bodyScans.weight,
				notes: bodyScans.notes,
				tags: bodyScans.tags,
				isBaseline: bodyScans.isBaseline,
				isPublic: bodyScans.isPublic,
				jackScore: bodyScans.jackScore,
				createdAt: bodyScans.createdAt,
			})
			.from(bodyScans)
			.where(eq(bodyScans.userId, session.user.id))
			.orderBy(desc(bodyScans.createdAt))
			.limit(limit)
			.offset(offset);

		// Convert weights back to kg and generate signed URLs for response
		const formattedScans = await Promise.all(
			userBodyScans.map(async (scan) => ({
				...scan,
				imageUrl: await getImageUrl(scan.imageUrl, scan.isPublic || false), // Generate signed URL
				weight: scan.weight ? scan.weight / 1000 : null,
				bodyFatPercentage: scan.bodyFatPercentage
					? scan.bodyFatPercentage / 100
					: null,
				muscleMass: scan.muscleMass ? scan.muscleMass / 1000 : null,
				jackScore: scan.jackScore, // Jack Score is already in the correct format (0-1000)
			}))
		);

		return NextResponse.json({
			success: true,
			bodyScans: formattedScans,
		});
	} catch (error) {
		console.error("Error fetching body scans:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
