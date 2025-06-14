import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFeedback } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
	try {
		// Check for authenticated session (optional for feedback)
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		const body = await request.json();
		const { feedback, rating, source = "onboarding", deviceId } = body;

		// Validate input
		if (
			!feedback ||
			typeof feedback !== "string" ||
			feedback.trim().length === 0
		) {
			return NextResponse.json(
				{ error: "Feedback is required" },
				{ status: 400 }
			);
		}

		if (feedback.trim().length > 500) {
			return NextResponse.json(
				{ error: "Feedback must be 500 characters or less" },
				{ status: 400 }
			);
		}

		// Validate rating if provided
		if (
			rating !== undefined &&
			(typeof rating !== "number" || rating < 1 || rating > 5)
		) {
			return NextResponse.json(
				{ error: "Rating must be between 1 and 5" },
				{ status: 400 }
			);
		}

		// Get client IP and user agent for anonymous tracking
		const clientIP =
			request.headers.get("x-forwarded-for") ||
			request.headers.get("x-real-ip") ||
			"unknown";
		const userAgent = request.headers.get("user-agent") || "unknown";

		// Insert feedback into database
		const feedbackRecord = await db
			.insert(userFeedback)
			.values({
				id: nanoid(),
				userId: session?.user?.id || null, // Nullable for anonymous users
				feedback: feedback.trim(),
				rating: rating || null,
				source,
				status: "pending",
				deviceId: deviceId || null,
				userAgent,
				ipAddress: clientIP,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		const logMessage = session?.user?.id
			? `Feedback submitted by user ${session.user.id}`
			: `Anonymous feedback submitted from ${clientIP}`;

		console.log(logMessage, {
			rating,
			feedback: feedback.trim(),
			source,
			deviceId,
		});

		return NextResponse.json(
			{
				success: true,
				message: "Feedback submitted successfully",
				id: feedbackRecord[0].id,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error submitting feedback:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "50");
		const status = url.searchParams.get("status");
		const source = url.searchParams.get("source");

		const offset = (page - 1) * limit;

		// Build query conditions
		const conditions: string[] = [];
		if (status) {
			conditions.push(`status = '${status}'`);
		}
		if (source) {
			conditions.push(`source = '${source}'`);
		}

		const whereClause =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		// Get feedback with user information
		const feedbackList = await db.execute(`
			SELECT 
				uf.*,
				u.name as user_name,
				u.email as user_email
			FROM user_feedback uf
			LEFT JOIN "user" u ON uf.user_id = u.id
			${whereClause}
			ORDER BY uf.created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`);

		// Get total count
		const countResult = await db.execute(`
			SELECT COUNT(*) as total
			FROM user_feedback uf
			${whereClause}
		`);

		const total = parseInt(countResult.rows[0].total as string);

		return NextResponse.json({
			feedback: feedbackList.rows,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching feedback:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
