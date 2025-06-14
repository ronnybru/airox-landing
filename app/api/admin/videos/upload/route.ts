import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/app/actions/user-helpers";
import {
	uploadVideoToS3,
	generateVideoKey,
	validateVideoFile,
	generatePresignedVideoUploadUrl,
} from "@/lib/s3";

export async function POST(request: NextRequest) {
	try {
		// Check admin access
		await checkAdminAccess();

		const formData = await request.formData();
		const file = formData.get("video") as File;
		const uploadMethod = formData.get("method") as string; // "direct" or "presigned"

		if (!file) {
			return NextResponse.json(
				{ error: "No video file provided" },
				{ status: 400 }
			);
		}

		// Validate video file
		const validation = validateVideoFile({
			mimetype: file.type,
			size: file.size,
		});

		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		const key = generateVideoKey(file.name);

		if (uploadMethod === "presigned") {
			// Generate presigned URL for client-side upload
			const presignedUrl = await generatePresignedVideoUploadUrl(
				key,
				file.type
			);

			return NextResponse.json({
				presignedUrl,
				key,
				finalUrl: `https://${process.env.AWS_S3_VIDEO_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
			});
		} else {
			// Direct server-side upload
			const buffer = Buffer.from(await file.arrayBuffer());
			const result = await uploadVideoToS3(buffer, key, file.type, {
				originalName: file.name,
				uploadedBy: "admin",
			});

			return NextResponse.json({
				url: result.url,
				key: result.key,
				bucket: result.bucket,
			});
		}
	} catch (error) {
		console.error("Error uploading video:", error);
		return NextResponse.json(
			{ error: "Failed to upload video" },
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
		const validation = validateVideoFile({
			mimetype: contentType,
			size: 0, // Size will be validated on actual upload
		});

		if (!validation.valid) {
			return NextResponse.json({ error: validation.error }, { status: 400 });
		}

		const key = generateVideoKey(fileName);
		const presignedUrl = await generatePresignedVideoUploadUrl(
			key,
			contentType
		);

		return NextResponse.json({
			presignedUrl,
			key,
			finalUrl: `https://${process.env.AWS_S3_VIDEO_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
		});
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		return NextResponse.json(
			{ error: "Failed to generate presigned URL" },
			{ status: 500 }
		);
	}
}
