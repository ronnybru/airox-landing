import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import {
	uploadToS3,
	generateFileKey,
	validateImageFile,
	generatePresignedUploadUrl,
} from "@/lib/s3";

export async function POST(request: NextRequest) {
	try {
		// Check admin access
		await checkAdminAccess();

		const formData = await request.formData();
		const file = formData.get("image") as File;
		const uploadMethod = formData.get("method") as string; // "direct" or "presigned"

		if (!file) {
			return NextResponse.json(
				{ error: "No image file provided" },
				{ status: 400 }
			);
		}

		// Validate image file
		const validation = validateImageFile({
			mimetype: file.type,
			size: file.size,
		});

		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		const key = generateFileKey("admin", file.name, "exercise-images");

		if (uploadMethod === "presigned") {
			// Generate presigned URL for client-side upload
			const presignedUrl = await generatePresignedUploadUrl(key, file.type);

			return NextResponse.json({
				presignedUrl,
				key,
				finalUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
			});
		} else {
			// Direct server-side upload
			const buffer = Buffer.from(await file.arrayBuffer());
			const result = await uploadToS3(buffer, key, file.type, {
				originalName: file.name,
				uploadedBy: "admin",
			});

			// For exercise images, we want them to be publicly accessible
			const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

			return NextResponse.json({
				url: publicUrl,
				key: result.key,
				bucket: result.bucket,
			});
		}
	} catch (error) {
		console.error("Error uploading image:", error);
		return NextResponse.json(
			{ error: "Failed to upload image" },
			{ status: 500 }
		);
	}
}

// Generate presigned URL only
export async function GET(request: NextRequest) {
	try {
		// Check admin access
		await checkAdminAccess();

		const { searchParams } = new URL(request.url);
		const fileName = searchParams.get("fileName");
		const contentType = searchParams.get("contentType");

		if (!fileName || !contentType) {
			return NextResponse.json(
				{ error: "fileName and contentType are required" },
				{ status: 400 }
			);
		}

		// Validate content type
		const validation = validateImageFile({
			mimetype: contentType,
			size: 0, // Size will be validated on actual upload
		});

		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		const key = generateFileKey("admin", fileName, "exercise-images");
		const presignedUrl = await generatePresignedUploadUrl(key, contentType);

		return NextResponse.json({
			presignedUrl,
			key,
			finalUrl: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
		});
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		return NextResponse.json(
			{ error: "Failed to generate presigned URL" },
			{ status: 500 }
		);
	}
}
