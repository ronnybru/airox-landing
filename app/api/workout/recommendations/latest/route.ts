import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workoutRecommendations } from "@/lib/db/schema";
import { eq, desc, and, gt } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;

		// Get the latest workout recommendation for this user that's still valid
		const latestRecommendation = await db
			.select()
			.from(workoutRecommendations)
			.where(
				and(
					eq(workoutRecommendations.userId, userId),
					gt(workoutRecommendations.validUntil, new Date()) // Still valid
				)
			)
			.orderBy(desc(workoutRecommendations.createdAt))
			.limit(1);

		if (latestRecommendation.length === 0) {
			return NextResponse.json({ aiReasoning: null });
		}

		const recommendation = latestRecommendation[0];

		return NextResponse.json({
			aiReasoning: recommendation.aiReasoning,
			createdAt: recommendation.createdAt,
			contextFactors: recommendation.contextFactors,
		});
	} catch (error) {
		console.error("Error fetching latest recommendation:", error);
		return NextResponse.json(
			{ error: "Failed to fetch recommendation" },
			{ status: 500 }
		);
	}
}
