import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workoutSessions } from "@/lib/db/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the most recent session that's either planned or in_progress
		const currentSession = await db
			.select()
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.userId, session.user.id),
					or(
						eq(workoutSessions.status, "planned"),
						eq(workoutSessions.status, "in_progress")
					)
				)
			)
			.orderBy(desc(workoutSessions.createdAt))
			.limit(1);

		return NextResponse.json({
			session: currentSession.length > 0 ? currentSession[0] : null,
		});
	} catch (error) {
		console.error("Error fetching current session:", error);
		return NextResponse.json(
			{ error: "Failed to fetch current session" },
			{ status: 500 }
		);
	}
}
