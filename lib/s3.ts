import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectAclCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
	region: process.env.AWS_REGION || "us-east-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const VIDEO_BUCKET_NAME = process.env.AWS_S3_VIDEO_BUCKET_NAME || BUCKET_NAME; // Separate bucket for videos
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN; // Optional: for faster delivery

export interface UploadResult {
	url: string;
	key: string;
	bucket: string;
}

/**
 * Upload a file buffer to S3
 */
export async function uploadToS3(
	buffer: Buffer,
	key: string,
	contentType: string,
	metadata?: Record<string, string>
): Promise<UploadResult> {
	try {
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType,
			Metadata: metadata,
			// DO NOT set ACL to public-read - keep private by default
			// Public access will be controlled at the application level
		});

		await s3Client.send(command);

		// For private uploads, we'll generate signed URLs when needed
		// Store the S3 key for later access control
		return {
			url: key, // Return the key instead of public URL
			key,
			bucket: BUCKET_NAME,
		};
	} catch (error) {
		console.error("Error uploading to S3:", error);
		throw new Error("Failed to upload file to S3");
	}
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
	try {
		const command = new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});

		await s3Client.send(command);
	} catch (error) {
		console.error("Error deleting from S3:", error);
		throw new Error("Failed to delete file from S3");
	}
}

/**
 * Generate a presigned URL for direct upload from client
 */
export async function generatePresignedUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600 // 1 hour
): Promise<string> {
	try {
		const command = new PutObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			ACL: "public-read",
		});

		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
		return signedUrl;
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		throw new Error("Failed to generate presigned URL");
	}
}

/**
 * Generate a unique file key for S3
 */
export function generateFileKey(
	userId: string,
	originalName: string,
	prefix: string = "body-scans"
): string {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const extension = originalName.split(".").pop() || "jpg";

	return `${prefix}/${userId}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Validate file type for body scan images
 */
export function validateImageFile(file: { mimetype: string; size: number }): {
	valid: boolean;
	error?: string;
} {
	const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
	const maxSize = 10 * 1024 * 1024; // 10MB

	if (!allowedTypes.includes(file.mimetype)) {
		return {
			valid: false,
			error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
		};
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: "File size too large. Maximum size is 10MB.",
		};
	}

	return { valid: true };
}

/**
 * Generate a signed URL for secure access to private images
 */
export async function getSignedImageUrl(
	key: string,
	expiresIn: number = 3600 // 1 hour
): Promise<string> {
	try {
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key: key,
		});

		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
		return signedUrl;
	} catch (error) {
		console.error("Error generating signed URL:", error);
		throw new Error("Failed to generate signed URL");
	}
}

/**
 * Make an image publicly accessible (for public scans)
 */
export async function makeImagePublic(key: string): Promise<string> {
	try {
		const command = new PutObjectAclCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			ACL: "public-read",
		});

		await s3Client.send(command);

		// Return the public URL
		const url = CLOUDFRONT_DOMAIN
			? `https://${CLOUDFRONT_DOMAIN}/${key}`
			: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

		return url;
	} catch (error) {
		console.error("Error making image public:", error);
		throw new Error("Failed to make image public");
	}
}

/**
 * Make an image private (remove public access)
 */
export async function makeImagePrivate(key: string): Promise<void> {
	try {
		const command = new PutObjectAclCommand({
			Bucket: BUCKET_NAME,
			Key: key,
			ACL: "private",
		});

		await s3Client.send(command);
	} catch (error) {
		console.error("Error making image private:", error);
		throw new Error("Failed to make image private");
	}
}

/**
 * Get the appropriate URL for an image based on its visibility
 */
export async function getImageUrl(
	key: string,
	isPublic: boolean,
	expiresIn: number = 3600
): Promise<string> {
	if (isPublic) {
		// Return public URL for public images
		return CLOUDFRONT_DOMAIN
			? `https://${CLOUDFRONT_DOMAIN}/${key}`
			: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
	} else {
		// Generate signed URL for private images
		return await getSignedImageUrl(key, expiresIn);
	}
}

/**
 * Upload a video file to S3 with public access (for exercise videos)
 */
export async function uploadVideoToS3(
	buffer: Buffer,
	key: string,
	contentType: string,
	metadata?: Record<string, string>
): Promise<UploadResult> {
	try {
		const command = new PutObjectCommand({
			Bucket: VIDEO_BUCKET_NAME,
			Key: key,
			Body: buffer,
			ContentType: contentType,
			Metadata: metadata,
		});

		await s3Client.send(command);

		// Return the public URL for videos
		const url = CLOUDFRONT_DOMAIN
			? `https://${CLOUDFRONT_DOMAIN}/${key}`
			: `https://${VIDEO_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

		return {
			url,
			key,
			bucket: VIDEO_BUCKET_NAME,
		};
	} catch (error) {
		console.error("Error uploading video to S3:", error);
		throw new Error("Failed to upload video to S3");
	}
}

/**
 * Generate a unique file key for video uploads
 */
export function generateVideoKey(
	originalName: string,
	prefix: string = "exercise-videos"
): string {
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const extension = originalName.split(".").pop() || "mp4";

	return `${prefix}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Validate video file type and size
 */
export function validateVideoFile(file: { mimetype: string; size: number }): {
	valid: boolean;
	error?: string;
} {
	const allowedTypes = [
		"video/mp4",
		"video/webm",
		"video/quicktime",
		"video/x-msvideo",
	];
	const maxSize = 100 * 1024 * 1024; // 100MB

	if (!allowedTypes.includes(file.mimetype)) {
		return {
			valid: false,
			error:
				"Invalid file type. Only MP4, WebM, QuickTime, and AVI videos are allowed.",
		};
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: "File size too large. Maximum size is 100MB.",
		};
	}

	return { valid: true };
}

/**
 * Generate a presigned URL for direct video upload from client
 */
export async function generatePresignedVideoUploadUrl(
	key: string,
	contentType: string,
	expiresIn: number = 3600 // 1 hour
): Promise<string> {
	try {
		const command = new PutObjectCommand({
			Bucket: VIDEO_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			ACL: "public-read",
		});

		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
		return signedUrl;
	} catch (error) {
		console.error("Error generating presigned video URL:", error);
		throw new Error("Failed to generate presigned video URL");
	}
}
