import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { exercisePerformance, userExercises, exercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface SetData {
	reps?: number;
	weight?: number;
	duration?: number;
	restTime?: number;
}

interface BestPerformance {
	totalVolume?: number;
	maxWeight?: number;
	maxReps?: number;
	maxDuration?: number;
	date?: string;
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ exerciseId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { exerciseId } = await params;
		const body = await request.json();

		// Verify the exercise performance belongs to the user
		const performance = await db
			.select()
			.from(exercisePerformance)
			.where(
				and(
					eq(exercisePerformance.id, exerciseId),
					eq(exercisePerformance.userId, userId)
				)
			)
			.limit(1);

		if (performance.length === 0) {
			return NextResponse.json(
				{ error: "Exercise performance not found" },
				{ status: 404 }
			);
		}

		// Prepare update data
		const updateData: {
			actualSets?: SetData[];
			difficultyRating?: number;
			isCompleted?: boolean;
			isSkipped?: boolean;
			skipReason?: string;
			completedAt?: Date;
			completedSets?: number;
			totalVolume?: number;
		} = {};

		if (body.actualSets) {
			updateData.actualSets = body.actualSets;
			updateData.completedSets = body.actualSets.length;

			// Calculate total volume (weight * reps for all sets)
			const totalVolume = body.actualSets.reduce(
				(sum: number, set: SetData) => {
					return sum + (set.weight || 0) * (set.reps || 0);
				},
				0
			);
			updateData.totalVolume = totalVolume;
		}

		if (body.difficultyRating !== undefined) {
			updateData.difficultyRating = body.difficultyRating;
		}

		if (body.isCompleted !== undefined) {
			updateData.isCompleted = body.isCompleted;
			if (body.isCompleted) {
				updateData.completedAt = new Date();
			}
		}

		if (body.isSkipped !== undefined) {
			updateData.isSkipped = body.isSkipped;
			if (body.isSkipped) {
				updateData.skipReason = body.skipReason || "User skipped";
			}
		}

		// Update the exercise performance
		await db
			.update(exercisePerformance)
			.set(updateData)
			.where(eq(exercisePerformance.id, exerciseId));

		// If exercise is completed, update user exercise progression based on difficulty rating
		if (body.isCompleted && body.difficultyRating !== undefined) {
			await updateUserExerciseProgression(
				performance[0].userExerciseId,
				body.difficultyRating,
				body.actualSets
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating exercise performance:", error);
		return NextResponse.json(
			{ error: "Failed to update exercise performance" },
			{ status: 500 }
		);
	}
}

async function updateUserExerciseProgression(
	userExerciseId: string,
	difficultyRating: number,
	actualSets: SetData[]
) {
	try {
		// Get current user exercise data
		const userExercise = await db
			.select()
			.from(userExercises)
			.where(eq(userExercises.id, userExerciseId))
			.limit(1);

		if (userExercise.length === 0) return;

		const current = userExercise[0];

		// Get the exercise to determine if it's time-based
		const exerciseData = await db
			.select()
			.from(exercises)
			.where(eq(exercises.id, current.exerciseId))
			.limit(1);

		if (exerciseData.length === 0) return;

		const exercise = exerciseData[0];
		const isTimeBased = exercise.defaultDuration != null;

		// ───────────────────────────────────────────────────────────────
		// STEP-BASED PROGRESSION SYSTEM
		// For weight/reps: Each "step" = +1 rep (max baseReps+2). When reps reach
		// baseReps+2, we reset to baseReps and add 2.5kg weight.
		// For timed exercises: Each "step" = +5 seconds (max baseDuration+10s). When duration reaches
		// baseDuration+10s, we reset to baseDuration for next cycle.
		//
		// Difficulty Rating → Step Changes:
		// Way too Easy (1) → +4 steps
		// Easy         (2) → +2 steps
		// Perfect      (3) → +1 step
		// Too Hard     (4) → −1 step
		// Way Too Hard (5) → −3 steps
		// ───────────────────────────────────────────────────────────────

		// Map difficulty to step delta
		const stepDeltaMap: Record<number, number> = {
			1: 4, // Way too easy
			2: 2, // Easy
			3: 1, // Perfect
			4: -1, // Too hard
			5: -3, // Way too hard
		};
		let stepDelta = stepDeltaMap[difficultyRating] ?? 0;

		let newWeight = current.currentWeight || 0;
		let newReps = 0;
		let newDuration = 0;
		let baseReps = 0;
		let baseDuration = 0;

		const updateData: {
			currentWeight?: number;
			currentReps?: number;
			currentDuration?: number;
			baseReps?: number;
			baseDuration?: number;
			lastPerformed?: Date;
			totalSessions?: number;
			bestPerformance?: BestPerformance;
			updatedAt?: Date;
		} = {
			lastPerformed: new Date(),
			totalSessions: (current.totalSessions || 0) + 1,
			updatedAt: new Date(),
		};

		if (isTimeBased) {
			// TIME-BASED PROGRESSION (plank, wall-sit, etc.)
			// Initialize baseDuration if not set
			baseDuration = current.baseDuration ?? exercise.defaultDuration ?? 30;
			newDuration = current.currentDuration ?? baseDuration;

			const DURATION_UPPER = baseDuration + 10; // 10 seconds above base

			// Apply step changes
			while (stepDelta > 0) {
				if (newDuration < DURATION_UPPER) {
					newDuration += 5; // +5 seconds per step
				} else {
					// Reset to base duration for next cycle
					newDuration = baseDuration;
				}
				stepDelta--;
			}

			// Handle negative steps
			while (stepDelta < 0) {
				if (newDuration > baseDuration) {
					newDuration -= 5; // -5 seconds per step
				} else {
					// If already at base, go to upper bound (regression)
					newDuration = DURATION_UPPER;
				}
				stepDelta++;
			}

			// Ensure minimum duration of 5 seconds
			newDuration = Math.max(5, newDuration);

			updateData.baseDuration = baseDuration;
			updateData.currentDuration = newDuration;
		} else {
			// WEIGHT/REPS PROGRESSION (traditional exercises)
			// Initialize baseReps if not set
			baseReps = current.baseReps ?? exercise.defaultReps ?? 8;
			newReps = current.currentReps ?? baseReps;

			const REPS_UPPER = baseReps + 2; // 2 reps above base

			// Apply step changes
			while (stepDelta > 0) {
				if (newReps < REPS_UPPER) {
					newReps += 1; // +1 rep per step
				} else {
					// Reset reps to base and increase weight
					newReps = baseReps;
					newWeight += 2500; // +2.5 kg (stored in grams)
				}
				stepDelta--;
			}

			// Handle negative steps
			while (stepDelta < 0) {
				if (newReps > baseReps) {
					newReps -= 1; // -1 rep per step
				} else {
					// If already at base reps, decrease weight and go to upper reps
					newReps = REPS_UPPER;
					newWeight = Math.max(0, newWeight - 2500); // -2.5 kg (min 0)
				}
				stepDelta++;
			}

			// Ensure minimum reps
			newReps = Math.max(1, newReps);

			updateData.baseReps = baseReps;
			updateData.currentReps = newReps;
			updateData.currentWeight = newWeight;
		}

		// Update best performance if this was better
		if (actualSets && actualSets.length > 0) {
			const totalVolume = actualSets.reduce((sum: number, set: SetData) => {
				return sum + (set.weight || 0) * (set.reps || 0);
			}, 0);

			const maxWeight = Math.max(
				...actualSets.map((set: SetData) => set.weight || 0)
			);
			const maxReps = Math.max(
				...actualSets.map((set: SetData) => set.reps || 0)
			);
			const maxDuration = Math.max(
				...actualSets.map((set: SetData) => set.duration || 0)
			);

			const currentBest = current.bestPerformance as BestPerformance | null;
			if (
				!currentBest ||
				totalVolume > (currentBest.totalVolume || 0) ||
				maxDuration > (currentBest.maxDuration || 0)
			) {
				updateData.bestPerformance = {
					totalVolume,
					maxWeight,
					maxReps,
					maxDuration,
					date: new Date().toISOString(),
				};
			}
		}

		// Update the user exercise
		await db
			.update(userExercises)
			.set(updateData)
			.where(eq(userExercises.id, userExerciseId));

		console.log(
			`Updated user exercise progression for ${userExerciseId} based on difficulty ${difficultyRating}. ` +
				`${isTimeBased ? `Duration: ${newDuration}s (base: ${baseDuration}s)` : `Reps: ${newReps} (base: ${baseReps}), Weight: ${newWeight}g`}`
		);
	} catch (error) {
		console.error("Error updating user exercise progression:", error);
	}
}
