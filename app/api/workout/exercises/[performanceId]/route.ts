import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exercisePerformance, workoutSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

// Schema for updating exercise performance
const updatePerformanceSchema = z.object({
	actualSets: z
		.array(
			z.object({
				reps: z.number().min(0).max(50).optional(),
				weight: z.number().min(0).optional(), // in grams
				duration: z.number().min(0).nullable().optional(), // in seconds
				restTime: z.number().min(0).max(600).optional(), // in seconds
			})
		)
		.optional(),
	difficultyRating: z.number().min(1).max(5), // Required feedback
	formRating: z.number().min(1).max(5).optional(),
	enjoymentRating: z.number().min(1).max(5).optional(),
	exerciseNotes: z.string().optional(),
	isCompleted: z.boolean().optional(),
	isSkipped: z.boolean().optional(),
	skipReason: z.string().optional(),
});

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ performanceId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { performanceId } = await params;

		// Get exercise performance with session verification
		const performance = await db
			.select({
				performance: exercisePerformance,
				session: workoutSessions,
			})
			.from(exercisePerformance)
			.innerJoin(
				workoutSessions,
				eq(exercisePerformance.sessionId, workoutSessions.id)
			)
			.where(
				and(
					eq(exercisePerformance.id, performanceId),
					eq(workoutSessions.userId, userId)
				)
			)
			.limit(1);

		if (!performance || performance.length === 0) {
			return NextResponse.json(
				{ error: "Exercise performance not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(performance[0].performance);
	} catch (error) {
		console.error("Error fetching exercise performance:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exercise performance" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ performanceId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { performanceId } = await params;
		const body = await request.json();
		const updateData = updatePerformanceSchema.parse(body);

		// Verify ownership through session
		const performance = await db
			.select({
				performance: exercisePerformance,
				session: workoutSessions,
			})
			.from(exercisePerformance)
			.innerJoin(
				workoutSessions,
				eq(exercisePerformance.sessionId, workoutSessions.id)
			)
			.where(
				and(
					eq(exercisePerformance.id, performanceId),
					eq(workoutSessions.userId, userId)
				)
			)
			.limit(1);

		if (!performance || performance.length === 0) {
			return NextResponse.json(
				{ error: "Exercise performance not found" },
				{ status: 404 }
			);
		}

		const currentPerformance = performance[0].performance;
		const currentSession = performance[0].session;

		// Only allow updates if session is in progress
		if (currentSession.status !== "in_progress") {
			return NextResponse.json(
				{
					error:
						"Cannot update performance for a session that is not in progress",
				},
				{ status: 400 }
			);
		}

		// Calculate metrics if actualSets is provided
		let totalVolume: number | null = null;
		let averageRestTime: number | null = null;
		let completedSets = currentPerformance.completedSets;

		if (updateData.actualSets && updateData.actualSets.length > 0) {
			// Calculate total volume (weight * reps)
			totalVolume = updateData.actualSets.reduce((sum, set) => {
				return sum + (set.weight || 0) * (set.reps || 0);
			}, 0);

			// Calculate average rest time
			const restTimes = updateData.actualSets
				.map((set) => set.restTime)
				.filter((time) => time !== undefined) as number[];

			if (restTimes.length > 0) {
				averageRestTime = Math.round(
					restTimes.reduce((sum, time) => sum + time, 0) / restTimes.length
				);
			}

			// Update completed sets count
			completedSets = updateData.actualSets.length;
		}

		// Determine completion status
		let isCompleted = updateData.isCompleted;
		const isSkipped = updateData.isSkipped;
		let completedAt: Date | null = null;

		if (isCompleted && !currentPerformance.isCompleted) {
			completedAt = new Date();
		}

		if (isSkipped) {
			isCompleted = false; // Can't be both completed and skipped
		}

		// Update the performance record
		const updateFields: Record<string, unknown> = {
			difficultyRating: updateData.difficultyRating,
			updatedAt: new Date(),
		};

		if (updateData.actualSets) {
			updateFields.actualSets = updateData.actualSets;
			updateFields.completedSets = completedSets;
		}

		if (totalVolume !== null) {
			updateFields.totalVolume = totalVolume;
		}

		if (averageRestTime !== null) {
			updateFields.averageRestTime = averageRestTime;
		}

		if (updateData.formRating !== undefined) {
			updateFields.formRating = updateData.formRating;
		}

		if (updateData.enjoymentRating !== undefined) {
			updateFields.enjoymentRating = updateData.enjoymentRating;
		}

		if (updateData.exerciseNotes !== undefined) {
			updateFields.exerciseNotes = updateData.exerciseNotes;
		}

		if (isCompleted !== undefined) {
			updateFields.isCompleted = isCompleted;
		}

		if (isSkipped !== undefined) {
			updateFields.isSkipped = isSkipped;
		}

		if (updateData.skipReason !== undefined) {
			updateFields.skipReason = updateData.skipReason;
		}

		if (completedAt) {
			updateFields.completedAt = completedAt;
		}

		// If this is the first time starting the exercise, set startedAt
		if (
			!currentPerformance.startedAt &&
			(updateData.actualSets || isCompleted)
		) {
			updateFields.startedAt = new Date();
		}

		// Calculate time to complete if completing now
		if (completedAt && currentPerformance.startedAt) {
			const timeToComplete = Math.round(
				(completedAt.getTime() -
					new Date(currentPerformance.startedAt).getTime()) /
					1000
			);
			updateFields.timeToComplete = timeToComplete;
		}

		await db
			.update(exercisePerformance)
			.set(updateFields)
			.where(eq(exercisePerformance.id, performanceId));

		// Update session's completed exercises count if this exercise was just completed
		if (isCompleted && !currentPerformance.isCompleted) {
			const sessionCompletedCount = await db
				.select()
				.from(exercisePerformance)
				.where(
					and(
						eq(exercisePerformance.sessionId, currentSession.id),
						eq(exercisePerformance.isCompleted, true)
					)
				);

			await db
				.update(workoutSessions)
				.set({
					completedExercises: sessionCompletedCount.length,
					updatedAt: new Date(),
				})
				.where(eq(workoutSessions.id, currentSession.id));
		}

		return NextResponse.json({
			message: "Exercise performance updated successfully",
			isCompleted: isCompleted || false,
			isSkipped: isSkipped || false,
			totalVolume,
			completedSets,
		});
	} catch (error) {
		console.error("Error updating exercise performance:", error);
		return NextResponse.json(
			{ error: "Failed to update exercise performance" },
			{ status: 500 }
		);
	}
}
