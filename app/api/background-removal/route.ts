import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const BG_REMOVAL_API_BASE =
	process.env.BG_REMOVAL_API_URL || "https://image.postrr.io";
const BG_REMOVAL_API_KEY = process.env.BG_REMOVAL_API_KEY;

export interface BackgroundRemovalOptions {
	model?: "RMBG-2.0";
	sensitivity?: number;
	process_res?: number;
	background?: "Alpha";
}

export interface BackgroundRemovalRequest {
	image_data: string;
	options?: BackgroundRemovalOptions;
}

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): boolean {
	const now = Date.now();
	const userLimit = rateLimitMap.get(userId);

	if (!userLimit || now > userLimit.resetTime) {
		// Reset or create new limit
		rateLimitMap.set(userId, {
			count: 1,
			resetTime: now + RATE_LIMIT_WINDOW,
		});
		return true;
	}

	if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
		return false;
	}

	userLimit.count++;
	return true;
}

export async function POST(request: NextRequest) {
	try {
		// Log configuration details
		console.log("🔧 [Background Removal API] Configuration:");
		console.log("🌐 API Base URL:", BG_REMOVAL_API_BASE);
		console.log("🔑 API Key configured:", !!BG_REMOVAL_API_KEY);
		console.log(
			"🔑 API Key (first 10 chars):",
			BG_REMOVAL_API_KEY
				? BG_REMOVAL_API_KEY.substring(0, 10) + "..."
				: "NOT SET"
		);

		// Check if API key is configured
		if (!BG_REMOVAL_API_KEY) {
			console.error("❌ Background removal API key not configured");
			return NextResponse.json(
				{ error: "Background removal service not configured" },
				{ status: 500 }
			);
		}

		// Check authentication
		console.log("🔍 [Background Removal API] Checking authentication...");
		console.log(
			"🔍 [Background Removal API] Request headers:",
			Object.fromEntries(request.headers.entries())
		);

		const session = await auth.api.getSession({
			headers: request.headers,
		});

		console.log("🔍 [Background Removal API] Session result:", {
			hasSession: !!session,
			hasUser: !!session?.user,
			userId: session?.user?.id,
			userEmail: session?.user?.email,
		});

		if (!session?.user) {
			console.log(
				"🚨 [Background Removal API] No valid session - returning 401"
			);
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		console.log("✅ [Background Removal API] Authentication successful");

		// Rate limiting
		if (!checkRateLimit(session.user.id)) {
			return NextResponse.json(
				{ error: "Rate limit exceeded. Please try again later." },
				{ status: 429 }
			);
		}

		// Parse request body
		const body: BackgroundRemovalRequest = await request.json();

		if (!body.image_data) {
			return NextResponse.json(
				{ error: "image_data is required" },
				{ status: 400 }
			);
		}

		console.log(
			"🖼️ Processing background removal request for user:",
			session.user.id
		);
		console.log("📄 Base64 image length:", body.image_data.length);

		// Prepare request payload for ComfyUI API
		const payload = {
			image_data: body.image_data,
			model: body.options?.model || "RMBG-2.0",
			sensitivity: body.options?.sensitivity || 1,
			process_res: body.options?.process_res || 1024,
			background: body.options?.background || "Alpha",
		};

		console.log("📦 Request payload prepared:", {
			model: payload.model,
			sensitivity: payload.sensitivity,
			process_res: payload.process_res,
			background: payload.background,
			image_data_length: payload.image_data.length,
			user_id: session.user.id,
		});

		// Make request to ComfyUI API
		const requestUrl = `${BG_REMOVAL_API_BASE}/remove-background`;
		console.log("🌐 Making request to:", requestUrl);

		const response = await fetch(requestUrl, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${BG_REMOVAL_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		console.log("📡 Response status:", response.status);
		console.log(
			"📡 Response headers:",
			Object.fromEntries(response.headers.entries())
		);

		if (!response.ok) {
			// Try to get error details from response
			let errorDetails = "";
			try {
				const errorText = await response.text();
				errorDetails = errorText;
				console.log("❌ Error response body:", errorText);
			} catch {
				console.log("❌ Could not read error response body");
			}

			// Log the error but don't expose internal details to client
			console.error(
				`❌ Background removal API failed: ${response.status} ${response.statusText}. Details: ${errorDetails}`
			);

			return NextResponse.json(
				{ error: "Background removal service temporarily unavailable" },
				{ status: 503 }
			);
		}

		// Return the processed image as blob
		const blob = await response.blob();
		const arrayBuffer = await blob.arrayBuffer();

		console.log(
			"✅ Background removal completed successfully for user:",
			session.user.id
		);

		// Return the image with proper headers
		return new NextResponse(arrayBuffer, {
			status: 200,
			headers: {
				"Content-Type": blob.type || "image/png",
				"Content-Length": arrayBuffer.byteLength.toString(),
				"Cache-Control": "private, max-age=3600", // Cache for 1 hour
			},
		});
	} catch (error) {
		console.error("❌ Background removal endpoint error:", error);

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Health check endpoint
export async function GET() {
	try {
		if (!BG_REMOVAL_API_KEY) {
			return NextResponse.json(
				{ status: "error", message: "API key not configured" },
				{ status: 500 }
			);
		}

		// Check if the external API is available
		const response = await fetch(`${BG_REMOVAL_API_BASE}/health`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${BG_REMOVAL_API_KEY}`,
			},
		});

		if (response.ok) {
			return NextResponse.json({ status: "healthy" });
		} else {
			return NextResponse.json(
				{ status: "error", message: "External API unavailable" },
				{ status: 503 }
			);
		}
	} catch (error) {
		console.error("Background removal health check failed:", error);
		return NextResponse.json(
			{ status: "error", message: "Health check failed" },
			{ status: 503 }
		);
	}
}
