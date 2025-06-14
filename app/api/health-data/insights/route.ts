import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { healthInsights } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

// GET - Retrieve user's health insights
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "10");
		const unreadOnly = searchParams.get("unreadOnly") === "true";

		const baseCondition = eq(healthInsights.userId, session.user.id);
		const whereConditions = unreadOnly
			? and(baseCondition, eq(healthInsights.isRead, false))
			: baseCondition;

		const insights = await db
			.select()
			.from(healthInsights)
			.where(whereConditions)
			.orderBy(desc(healthInsights.createdAt))
			.limit(limit);

		// Count unread insights
		const unreadCount = await db
			.select({ count: healthInsights.id })
			.from(healthInsights)
			.where(
				and(
					eq(healthInsights.userId, session.user.id),
					eq(healthInsights.isRead, false)
				)
			);

		return NextResponse.json({
			insights,
			unreadCount: unreadCount.length,
			count: insights.length,
		});
	} catch (error) {
		console.error("Error fetching health insights:", error);
		return NextResponse.json(
			{ error: "Failed to fetch health insights" },
			{ status: 500 }
		);
	}
}

// PATCH - Mark insight as read
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { insightId } = await request.json();

		if (!insightId) {
			return NextResponse.json(
				{ error: "Insight ID is required" },
				{ status: 400 }
			);
		}

		// Update the insight to mark as read
		await db
			.update(healthInsights)
			.set({ isRead: true })
			.where(
				and(
					eq(healthInsights.id, insightId),
					eq(healthInsights.userId, session.user.id)
				)
			);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error marking insight as read:", error);
		return NextResponse.json(
			{ error: "Failed to mark insight as read" },
			{ status: 500 }
		);
	}
}
