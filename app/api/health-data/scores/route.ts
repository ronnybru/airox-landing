import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { healthScores } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET - Retrieve user's health scores
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const days = parseInt(searchParams.get("days") || "30");

		const scores = await db
			.select()
			.from(healthScores)
			.where(eq(healthScores.userId, session.user.id))
			.orderBy(desc(healthScores.date))
			.limit(days);

		// Get latest score for quick access
		const latestScore = scores.length > 0 ? scores[0] : null;

		return NextResponse.json({
			scores,
			latestScore,
			count: scores.length,
		});
	} catch (error) {
		console.error("Error fetching health scores:", error);
		return NextResponse.json(
			{ error: "Failed to fetch health scores" },
			{ status: 500 }
		);
	}
}
