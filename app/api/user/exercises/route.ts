import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userExercises, exercises, user } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import {
	getLocalizedExercise,
	getUserLanguage,
	type SupportedLanguage,
} from "@/lib/exercise-utils";

export async function GET(request: NextRequest) {
	try {
		console.log("GET /api/user/exercises called");
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		console.log("Session:", session?.user?.id);
		if (!session?.user?.id) {
			console.log("No session or user ID");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user's language preference
		let userLanguage = "en";
		const userData = await db
			.select({ language: user.language })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (userData.length > 0) {
			userLanguage = getUserLanguage(userData[0].language);
		}

		const userExercisesList = await db
			.select({
				id: userExercises.id,
				isActive: userExercises.isActive,
				currentLevel: userExercises.currentLevel,
				currentWeight: userExercises.currentWeight,
				currentReps: userExercises.currentReps,
				currentSets: userExercises.currentSets,
				currentDuration: userExercises.currentDuration,
				lastPerformed: userExercises.lastPerformed,
				totalSessions: userExercises.totalSessions,
				bestPerformance: userExercises.bestPerformance,
				notes: userExercises.notes,
				addedAt: userExercises.addedAt,
				exercise: exercises,
			})
			.from(userExercises)
			.innerJoin(exercises, eq(userExercises.exerciseId, exercises.id))
			.where(eq(userExercises.userId, session.user.id))
			.orderBy(asc(userExercises.addedAt));

		// Localize exercise data
		const localizedUserExercises = userExercisesList.map((userExercise) => ({
			...userExercise,
			exercise: getLocalizedExercise(
				userExercise.exercise,
				userLanguage as SupportedLanguage
			),
		}));

		console.log(
			"Found user exercises:",
			localizedUserExercises.length,
			"Language:",
			userLanguage
		);
		return NextResponse.json(localizedUserExercises);
	} catch (error) {
		console.error("Failed to fetch user exercises:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user exercises" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { exerciseId } = await request.json();

		if (!exerciseId) {
			return NextResponse.json(
				{ error: "Exercise ID is required" },
				{ status: 400 }
			);
		}

		// Check if exercise exists
		const exercise = await db
			.select()
			.from(exercises)
			.where(eq(exercises.id, exerciseId))
			.limit(1);

		if (exercise.length === 0) {
			return NextResponse.json(
				{ error: "Exercise not found" },
				{ status: 404 }
			);
		}

		// Check if user already has this exercise
		const existingUserExercise = await db
			.select()
			.from(userExercises)
			.where(
				eq(userExercises.userId, session.user.id) &&
					eq(userExercises.exerciseId, exerciseId)
			)
			.limit(1);

		if (existingUserExercise.length > 0) {
			return NextResponse.json(
				{ error: "Exercise already added to your routine" },
				{ status: 409 }
			);
		}

		// Add exercise to user's routine
		const newUserExercise = await db
			.insert(userExercises)
			.values({
				id: nanoid(),
				userId: session.user.id,
				exerciseId,
				isActive: true,
				currentLevel: 1,
				currentSets: exercise[0].defaultSets,
				baseReps: exercise[0].defaultReps, // Set baseReps for step progression
				currentReps: exercise[0].defaultReps,
				baseDuration: exercise[0].defaultDuration, // Set baseDuration for step progression
				currentDuration: exercise[0].defaultDuration,
				totalSessions: 0,
				addedAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		return NextResponse.json(newUserExercise[0], { status: 201 });
	} catch (error) {
		console.error("Failed to add user exercise:", error);
		return NextResponse.json(
			{ error: "Failed to add exercise" },
			{ status: 500 }
		);
	}
}
