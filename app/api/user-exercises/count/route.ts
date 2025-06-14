import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userExercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Count active user exercises
		const result = await db
			.select({ count: userExercises.id })
			.from(userExercises)
			.where(
				and(
					eq(userExercises.userId, session.user.id),
					eq(userExercises.isActive, true)
				)
			);

		const count = result.length;

		return NextResponse.json({ count });
	} catch (error) {
		console.error("Error getting user exercise count:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
