import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

interface ApplyExerciseRequest {
	exercises: {
		exerciseId: string;
		recommendedSets: number;
		recommendedReps: number;
		recommendedWeight: number;
	}[];
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const body: ApplyExerciseRequest = await request.json();

		if (!body.exercises || body.exercises.length !== 15) {
			return NextResponse.json(
				{ error: "Exactly 15 exercises are required" },
				{ status: 400 }
			);
		}

		// First, delete all existing user exercises
		await db.delete(userExercises).where(eq(userExercises.userId, userId));

		// Then, insert the new exercises
		const userExerciseData = body.exercises.map((exercise) => ({
			id: nanoid(),
			userId: userId,
			exerciseId: exercise.exerciseId,
			isActive: true,
			currentLevel: 1,
			currentWeight: exercise.recommendedWeight,
			baseReps: exercise.recommendedReps, // Set baseReps for step progression
			currentReps: exercise.recommendedReps,
			currentSets: exercise.recommendedSets,
			baseDuration: null, // Will be set from exercise defaults during progression
			currentDuration: null,
			lastPerformed: null,
			totalSessions: 0,
			bestPerformance: null,
			preferredRestTime: null,
			notes: null,
			addedAt: new Date(),
			updatedAt: new Date(),
		}));

		await db.insert(userExercises).values(userExerciseData);

		return NextResponse.json({
			success: true,
			message: "Exercises applied successfully",
			count: userExerciseData.length,
		});
	} catch (error) {
		console.error("Error applying exercises:", error);
		return NextResponse.json(
			{ error: "Failed to apply exercises" },
			{ status: 500 }
		);
	}
}
