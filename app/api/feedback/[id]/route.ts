import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFeedback } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { status, adminNotes } = body;

		// Validate input
		if (status && !["pending", "reviewed", "resolved"].includes(status)) {
			return NextResponse.json(
				{ error: "Invalid status value" },
				{ status: 400 }
			);
		}

		if (adminNotes && typeof adminNotes !== "string") {
			return NextResponse.json(
				{ error: "Admin notes must be a string" },
				{ status: 400 }
			);
		}

		// Build update object
		const updateData: {
			updatedAt: Date;
			status?: string;
			adminNotes?: string;
		} = {
			updatedAt: new Date(),
		};

		if (status) {
			updateData.status = status;
		}

		if (adminNotes !== undefined) {
			updateData.adminNotes = adminNotes;
		}

		// Update feedback in database
		const updatedFeedback = await db
			.update(userFeedback)
			.set(updateData)
			.where(eq(userFeedback.id, id))
			.returning();

		if (updatedFeedback.length === 0) {
			return NextResponse.json(
				{ error: "Feedback not found" },
				{ status: 404 }
			);
		}

		console.log(`Feedback ${id} updated by admin ${session.user.id}:`, {
			status,
			adminNotes: adminNotes ? "notes added" : "no notes",
		});

		return NextResponse.json({
			success: true,
			message: "Feedback updated successfully",
			feedback: updatedFeedback[0],
		});
	} catch (error) {
		console.error("Error updating feedback:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Get specific feedback with user information
		const feedbackResult = await db.execute(`
			SELECT
				uf.*,
				u.name as user_name,
				u.email as user_email
			FROM user_feedback uf
			LEFT JOIN "user" u ON uf.user_id = u.id
			WHERE uf.id = '${id}'
		`);

		if (feedbackResult.rows.length === 0) {
			return NextResponse.json(
				{ error: "Feedback not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			feedback: feedbackResult.rows[0],
		});
	} catch (error) {
		console.error("Error fetching feedback:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
