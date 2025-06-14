import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userExercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ exerciseId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { exerciseId } = await params;

		// Find the user exercise by exercise ID
		const userExercise = await db
			.select()
			.from(userExercises)
			.where(
				and(
					eq(userExercises.userId, session.user.id),
					eq(userExercises.exerciseId, exerciseId)
				)
			)
			.limit(1);

		if (userExercise.length === 0) {
			return NextResponse.json(
				{ error: "User exercise not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(userExercise[0]);
	} catch (error) {
		console.error("Failed to fetch user exercise:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user exercise" },
			{ status: 500 }
		);
	}
}
