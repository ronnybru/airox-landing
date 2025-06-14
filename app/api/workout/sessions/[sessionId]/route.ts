import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	workoutSessions,
	exercisePerformance,
	exercises,
	userExercises,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getLocalizedExercise, getUserLanguage } from "@/lib/exercise-utils";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { sessionId } = await params;

		// Get the workout session
		const workoutSession = await db
			.select()
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.id, sessionId),
					eq(workoutSessions.userId, userId)
				)
			)
			.limit(1);

		if (workoutSession.length === 0) {
			return NextResponse.json(
				{ error: "Workout session not found" },
				{ status: 404 }
			);
		}

		// Get the exercises for this session with their details
		const sessionExercises = await db
			.select({
				performance: exercisePerformance,
				exercise: exercises,
				userExercise: userExercises,
			})
			.from(exercisePerformance)
			.innerJoin(exercises, eq(exercisePerformance.exerciseId, exercises.id))
			.innerJoin(
				userExercises,
				eq(exercisePerformance.userExerciseId, userExercises.id)
			)
			.where(eq(exercisePerformance.sessionId, sessionId))
			.orderBy(exercisePerformance.orderInSession);

		// Get user language for localization
		const userLang = getUserLanguage(session.user.language);

		// Format exercises for the frontend
		const formattedExercises = sessionExercises.map(
			({ performance, exercise }) => {
				const localizedExercise = getLocalizedExercise(exercise, userLang);

				return {
					id: performance.id,
					exerciseId: performance.exerciseId,
					userExerciseId: performance.userExerciseId,
					orderInSession: performance.orderInSession,
					plannedSets: performance.plannedSets,
					plannedReps: performance.plannedReps,
					plannedWeight: performance.plannedWeight,
					plannedDuration: performance.plannedDuration,
					difficultyRating: performance.difficultyRating,
					isCompleted: performance.isCompleted,
					isSkipped: performance.isSkipped,
					exercise: {
						name: localizedExercise.name,
						description: localizedExercise.description,
						instructions: localizedExercise.instructions,
						category: exercise.category,
						muscleGroups: exercise.muscleGroups,
						videoUrl: exercise.videoUrl,
						videoUrlDark: exercise.videoUrlDark,
					},
				};
			}
		);

		const response = {
			session: {
				id: workoutSession[0].id,
				status: workoutSession[0].status,
				targetDuration: workoutSession[0].targetDuration,
				startedAt: workoutSession[0].startedAt,
				currentExerciseIndex: workoutSession[0].currentExerciseIndex,
				recommendationContext: workoutSession[0].recommendationContext || {
					sessionReasoning: "AI-generated workout session",
					focusAreas: [],
					difficultyLevel: 5,
					estimatedDuration: workoutSession[0].targetDuration,
				},
			},
			exercises: formattedExercises,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error fetching workout session:", error);
		return NextResponse.json(
			{ error: "Failed to fetch workout session" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { sessionId } = await params;
		const body = await request.json();

		// Verify the session belongs to the user
		const workoutSession = await db
			.select()
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.id, sessionId),
					eq(workoutSessions.userId, userId)
				)
			)
			.limit(1);

		if (workoutSession.length === 0) {
			return NextResponse.json(
				{ error: "Workout session not found" },
				{ status: 404 }
			);
		}

		// Handle different actions
		if (body.action === "start") {
			await db
				.update(workoutSessions)
				.set({
					status: "in_progress",
					startedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(workoutSessions.id, sessionId));

			return NextResponse.json({ success: true });
		}

		if (body.action === "complete") {
			await db
				.update(workoutSessions)
				.set({
					status: "completed",
					completedAt: new Date(),
					overallRating: body.overallRating || null,
					actualDuration: body.actualDuration || null,
					updatedAt: new Date(),
				})
				.where(eq(workoutSessions.id, sessionId));

			return NextResponse.json({ success: true });
		}

		if (body.action === "update_progress") {
			await db
				.update(workoutSessions)
				.set({
					currentExerciseIndex: body.currentExerciseIndex,
					updatedAt: new Date(),
				})
				.where(eq(workoutSessions.id, sessionId));

			return NextResponse.json({ success: true });
		}

		// Handle other updates
		const updateData: {
			updatedAt: Date;
			status?: string;
			overallRating?: number;
			actualDuration?: number;
			sessionNotes?: string;
		} = {
			updatedAt: new Date(),
		};

		if (body.status) updateData.status = body.status;
		if (body.overallRating) updateData.overallRating = body.overallRating;
		if (body.actualDuration) updateData.actualDuration = body.actualDuration;
		if (body.sessionNotes) updateData.sessionNotes = body.sessionNotes;

		await db
			.update(workoutSessions)
			.set(updateData)
			.where(eq(workoutSessions.id, sessionId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating workout session:", error);
		return NextResponse.json(
			{ error: "Failed to update workout session" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { sessionId } = await params;

		// Verify the session belongs to the user
		const workoutSession = await db
			.select()
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.id, sessionId),
					eq(workoutSessions.userId, userId)
				)
			)
			.limit(1);

		if (workoutSession.length === 0) {
			return NextResponse.json(
				{ error: "Workout session not found" },
				{ status: 404 }
			);
		}

		// Delete the workout session (cascade will handle exercise performances)
		await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting workout session:", error);
		return NextResponse.json(
			{ error: "Failed to delete workout session" },
			{ status: 500 }
		);
	}
}
