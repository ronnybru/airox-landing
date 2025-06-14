import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	workoutSessions,
	userExercises,
	exercises,
	healthData,
	exercisePerformance,
	user as userTable,
} from "@/lib/db/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getLocalizedExercise, getUserLanguage } from "@/lib/exercise-utils";

// Schema for workout session creation
const createSessionSchema = z.object({
	userInput: z.string().optional(),
	availableTime: z.number().min(10).max(180), // 10-180 minutes
	energyLevel: z.number().min(1).max(5).optional(),
	conversationContext: z
		.array(
			z.object({
				id: z.string(),
				role: z.enum(["user", "assistant", "system"]),
				content: z.string(),
				timestamp: z.string(),
			})
		)
		.optional(), // Chat messages for context
});

// Schema for AI workout recommendation - will be dynamically updated
const createWorkoutRecommendationSchema = (exerciseCount: number) =>
	z.object({
		exercises: z
			.array(
				z.object({
					userExerciseId: z.string(),
					exerciseId: z.string(),
					sets: z.number().min(1).max(6),
					reps: z.number().min(0).max(30),
					weight: z.number().min(0), // in grams
					duration: z.number().min(0).optional(), // seconds for time-based
					restTime: z.number().min(30).max(300), // 30s-5min rest
					reasoning: z.string(),
				})
			)
			.length(exerciseCount), // Exact count instead of range
		sessionReasoning: z.string(),
		estimatedDuration: z.number(),
		focusAreas: z.array(z.string()),
		difficultyLevel: z.number().min(1).max(10),
	});

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const body = await request.json();
		const { userInput, availableTime, energyLevel, conversationContext } =
			createSessionSchema.parse(body);

		// Get user data
		const user = await db
			.select()
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);

		if (!user || user.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const userData = user[0];

		// Check if user has an active session
		const activeSession = await db
			.select()
			.from(workoutSessions)
			.where(
				and(
					eq(workoutSessions.userId, userId),
					eq(workoutSessions.status, "in_progress")
				)
			)
			.limit(1);

		if (activeSession.length > 0) {
			return NextResponse.json(
				{ error: "You already have an active workout session" },
				{ status: 400 }
			);
		}

		// Get user's active exercises
		const userActiveExercises = await db
			.select({
				userExercise: userExercises,
				exercise: exercises,
			})
			.from(userExercises)
			.innerJoin(exercises, eq(userExercises.exerciseId, exercises.id))
			.where(
				and(eq(userExercises.userId, userId), eq(userExercises.isActive, true))
			);

		if (userActiveExercises.length === 0) {
			return NextResponse.json(
				{
					error:
						"No active exercises found. Please set up your exercises first.",
				},
				{ status: 400 }
			);
		}

		// Get recent workout history (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const recentSessions = await db
			.select({
				session: workoutSessions,
				performances: sql<unknown>`json_agg(${exercisePerformance})`.as(
					"performances"
				),
			})
			.from(workoutSessions)
			.leftJoin(
				exercisePerformance,
				eq(workoutSessions.id, exercisePerformance.sessionId)
			)
			.where(
				and(
					eq(workoutSessions.userId, userId),
					eq(workoutSessions.status, "completed"),
					gte(workoutSessions.completedAt, sevenDaysAgo)
				)
			)
			.groupBy(workoutSessions.id)
			.orderBy(desc(workoutSessions.completedAt))
			.limit(5);

		// Get recent health data (HRV, sleep, etc.)
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const recentHealthData = await db
			.select()
			.from(healthData)
			.where(
				and(
					eq(healthData.userId, userId),
					gte(healthData.recordedAt, yesterday)
				)
			)
			.orderBy(desc(healthData.recordedAt));

		// Log data being passed to AI for debugging
		console.log("=== AI WORKOUT RECOMMENDATION DEBUG ===");
		console.log("User ID:", userId);
		console.log("Available Time:", availableTime);
		console.log("Energy Level:", energyLevel);
		console.log("User Input:", userInput);
		console.log(
			"Conversation Context:",
			conversationContext?.length || 0,
			"messages"
		);
		console.log("Recent Sessions Count:", recentSessions.length);
		console.log("Recent Health Data Count:", recentHealthData.length);
		console.log("User Active Exercises Count:", userActiveExercises.length);
		console.log("==========================================");

		// Generate AI workout recommendation
		const workoutRecommendation = await generateWorkoutRecommendation({
			userData,
			userActiveExercises,
			recentSessions,
			recentHealthData,
			userInput,
			availableTime,
			energyLevel,
			conversationContext,
		});

		// Validate that all exercise IDs and user exercise IDs exist in the database
		const recommendedExerciseIds = workoutRecommendation.exercises.map(
			(ex) => ex.exerciseId
		);
		const recommendedUserExerciseIds = workoutRecommendation.exercises.map(
			(ex) => ex.userExerciseId
		);
		const validExerciseIds = userActiveExercises.map(
			({ exercise }) => exercise.id
		);
		const validUserExerciseIds = userActiveExercises.map(
			({ userExercise }) => userExercise.id
		);

		const invalidExerciseIds = recommendedExerciseIds.filter(
			(id) => !validExerciseIds.includes(id)
		);
		const invalidUserExerciseIds = recommendedUserExerciseIds.filter(
			(id) => !validUserExerciseIds.includes(id)
		);

		if (invalidExerciseIds.length > 0 || invalidUserExerciseIds.length > 0) {
			// Check if AI swapped the IDs - if all invalid IDs exist in the opposite list, we can fix it
			const allInvalidExerciseIdsAreValidUserExerciseIds =
				invalidExerciseIds.every((id) => validUserExerciseIds.includes(id));
			const allInvalidUserExerciseIdsAreValidExerciseIds =
				invalidUserExerciseIds.every((id) => validExerciseIds.includes(id));

			if (
				allInvalidExerciseIdsAreValidUserExerciseIds &&
				allInvalidUserExerciseIdsAreValidExerciseIds &&
				invalidExerciseIds.length === invalidUserExerciseIds.length
			) {
				console.warn(
					"AI swapped exerciseId and userExerciseId - automatically fixing..."
				);

				// Fix the swapped IDs
				workoutRecommendation.exercises = workoutRecommendation.exercises.map(
					(ex) => ({
						...ex,
						exerciseId: ex.userExerciseId,
						userExerciseId: ex.exerciseId,
					})
				);

				console.log("Fixed workout recommendation by swapping IDs");
			} else {
				console.error("AI returned invalid IDs:");
				console.error("Invalid exercise IDs:", invalidExerciseIds);
				console.error("Invalid user exercise IDs:", invalidUserExerciseIds);
				console.error("Valid exercise IDs:", validExerciseIds);
				console.error("Valid user exercise IDs:", validUserExerciseIds);
				console.error(
					"AI recommendation:",
					JSON.stringify(workoutRecommendation, null, 2)
				);
				return NextResponse.json(
					{
						error:
							"AI generated invalid exercise recommendations. Please try again.",
						details: `Invalid exercise IDs: ${invalidExerciseIds.join(", ")}, Invalid user exercise IDs: ${invalidUserExerciseIds.join(", ")}`,
					},
					{ status: 500 }
				);
			}
		}

		// Create workout session
		const sessionId = nanoid();
		const newSession = {
			id: sessionId,
			userId,
			sessionType: "ai_recommended",
			targetDuration: availableTime,
			actualDuration: null,
			userInput: userInput || null,
			energyLevel: energyLevel || null,
			availableTime,
			status: "planned" as const,
			startedAt: null,
			completedAt: null,
			recommendationContext: {
				aiReasoning: workoutRecommendation.sessionReasoning,
				focusAreas: workoutRecommendation.focusAreas,
				difficultyLevel: workoutRecommendation.difficultyLevel,
				estimatedDuration: workoutRecommendation.estimatedDuration,
				conversationContext: conversationContext || null,
			},
			totalExercises: workoutRecommendation.exercises.length,
			completedExercises: 0,
			overallRating: null,
			sessionNotes: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await db.insert(workoutSessions).values(newSession);

		// Create exercise performance records for the session
		const exercisePerformanceData = workoutRecommendation.exercises.map(
			(ex, index) => ({
				id: nanoid(),
				sessionId,
				userId,
				exerciseId: ex.exerciseId,
				userExerciseId: ex.userExerciseId,
				orderInSession: index + 1,
				plannedSets: ex.sets,
				completedSets: 0,
				plannedReps: ex.reps,
				plannedWeight: ex.weight,
				plannedDuration: ex.duration || null,
				actualSets: null,
				difficultyRating: 0, // Will be set during workout
				formRating: null,
				enjoymentRating: null,
				exerciseNotes: null,
				totalVolume: null,
				averageRestTime: null,
				timeToComplete: null,
				isCompleted: false,
				isSkipped: false,
				skipReason: null,
				startedAt: null,
				completedAt: null,
				createdAt: new Date(),
			})
		);

		await db.insert(exercisePerformance).values(exercisePerformanceData);

		// Get localized exercise names for response
		const userLang = getUserLanguage(userData.language);
		const enhancedExercises = workoutRecommendation.exercises.map((ex) => {
			const userEx = userActiveExercises.find(
				(ue) => ue.userExercise.id === ex.userExerciseId
			);
			if (!userEx) return ex;

			const localizedExercise = getLocalizedExercise(userEx.exercise, userLang);
			return {
				...ex,
				name: localizedExercise.name,
				description: localizedExercise.description,
				instructions: localizedExercise.instructions,
			};
		});

		return NextResponse.json({
			sessionId,
			exercises: enhancedExercises,
			sessionReasoning: workoutRecommendation.sessionReasoning,
			estimatedDuration: workoutRecommendation.estimatedDuration,
			focusAreas: workoutRecommendation.focusAreas,
			difficultyLevel: workoutRecommendation.difficultyLevel,
		});
	} catch (error) {
		console.error("Error creating workout session:", error);
		return NextResponse.json(
			{ error: "Failed to create workout session" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = session.user.id;
		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");

		const whereConditions = [eq(workoutSessions.userId, userId)];

		if (status) {
			whereConditions.push(
				eq(
					workoutSessions.status,
					status as "planned" | "in_progress" | "completed" | "cancelled"
				)
			);
		}

		const sessions = await db
			.select()
			.from(workoutSessions)
			.where(and(...whereConditions))
			.orderBy(desc(workoutSessions.createdAt))
			.limit(20);

		return NextResponse.json({ sessions });
	} catch (error) {
		console.error("Error fetching workout sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch workout sessions" },
			{ status: 500 }
		);
	}
}

interface UserData {
	id: string;
	language?: string | null;
	gender?: string | null;
	birthDate?: Date | null;
	gymLevel?: string | null;
	preferredFocus?: string | null;
	injuries?: string | null;
	gymFrequency?: number | null;
}

interface UserActiveExercise {
	userExercise: {
		id: string;
		currentLevel: number;
		currentWeight: number | null;
		currentReps: number | null;
		currentSets: number;
		currentDuration: number | null;
		lastPerformed: Date | null;
		totalSessions: number;
	};
	exercise: {
		id: string;
		name: string;
		category: string;
		muscleGroups: string[];
		difficultyLevel: number;
		exerciseType: string;
		movementPattern: string | null;
		baseRestTime: number;
	};
}

interface RecentSession {
	session: {
		id: string;
		completedAt: Date | null;
	};
	performances: unknown;
}

interface HealthDataItem {
	dataType: string;
	value: number;
	recordedAt: Date;
}

async function generateWorkoutRecommendation({
	userData,
	userActiveExercises,
	recentSessions,
	recentHealthData,
	userInput,
	availableTime,
	energyLevel,
	conversationContext,
}: {
	userData: UserData;
	userActiveExercises: UserActiveExercise[];
	recentSessions: RecentSession[];
	recentHealthData: HealthDataItem[];
	userInput?: string;
	availableTime: number;
	energyLevel?: number;
	conversationContext?: Array<{
		id: string;
		role: "user" | "assistant" | "system";
		content: string;
		timestamp: string;
	}>;
}) {
	// Log detailed analysis for debugging
	console.log("=== AI RECOMMENDATION FUNCTION DEBUG ===");
	console.log("Recent Sessions Raw:", JSON.stringify(recentSessions, null, 2));

	// Analyze recent workout patterns with timing
	const muscleGroupLastTrained = new Map<
		string,
		{ date: Date; hoursAgo: number; difficulty: number }
	>();

	recentSessions.forEach((session) => {
		const sessionDate = new Date(session.session.completedAt || new Date());
		const performances = session.performances as Array<{
			is_completed: boolean;
			difficulty_rating: number;
			user_exercise_id: string;
		}> | null;

		console.log(`Session ${session.session.id} performances:`, performances);

		performances
			?.filter((p) => p?.is_completed)
			.forEach((p) => {
				const userEx = userActiveExercises.find(
					(ue) => ue.userExercise.id === p.user_exercise_id
				);

				if (userEx?.exercise.muscleGroups) {
					userEx.exercise.muscleGroups.forEach((muscleGroup) => {
						const hoursAgo = Math.round(
							(Date.now() - sessionDate.getTime()) / (1000 * 60 * 60)
						);

						// Only record if this is the most recent training for this muscle group
						if (
							!muscleGroupLastTrained.has(muscleGroup) ||
							muscleGroupLastTrained.get(muscleGroup)!.hoursAgo > hoursAgo
						) {
							muscleGroupLastTrained.set(muscleGroup, {
								date: sessionDate,
								hoursAgo,
								difficulty: p.difficulty_rating || 3,
							});
						}
					});
				}
			});
	});

	// Create formatted muscle group context
	const muscleGroupContext = Array.from(muscleGroupLastTrained.entries())
		.sort((a, b) => a[1].hoursAgo - b[1].hoursAgo) // Sort by most recent first
		.map(([muscleGroup, data]) => {
			const timeAgo =
				data.hoursAgo < 24
					? `${data.hoursAgo}h ago`
					: `${Math.floor(data.hoursAgo / 24)}d ${data.hoursAgo % 24}h ago`;
			return `${muscleGroup} (${timeAgo}, difficulty ${data.difficulty}/5)`;
		});

	console.log("Muscle group last trained:", muscleGroupContext);

	// Calculate days since last workout
	const lastWorkout = recentSessions[0]?.session.completedAt;
	const daysSinceLastWorkout = lastWorkout
		? Math.floor(
				(Date.now() - new Date(lastWorkout).getTime()) / (1000 * 60 * 60 * 24)
			)
		: 7;

	console.log("Last workout date:", lastWorkout);
	console.log("Days since last workout:", daysSinceLastWorkout);
	console.log("Muscle groups with timing:", muscleGroupContext);

	// Analyze recent performance difficulty
	const recentDifficulties = recentSessions.flatMap((session) => {
		const performances = session.performances as Array<{
			is_completed: boolean;
			difficulty_rating: number;
			user_exercise_id: string;
		}> | null;

		return (
			performances
				?.filter((p) => p?.difficulty_rating > 0)
				.map((p) => p.difficulty_rating) || []
		);
	});
	const avgRecentDifficulty =
		recentDifficulties.length > 0
			? recentDifficulties.reduce((a, b) => a + b, 0) /
				recentDifficulties.length
			: 3;

	// Get HRV and sleep data
	const hrvData = recentHealthData.filter((d) => d.dataType === "hrv");
	const sleepData = recentHealthData.filter((d) => d.dataType === "sleep");

	const avgHrv =
		hrvData.length > 0
			? hrvData.reduce((sum, d) => sum + d.value, 0) / hrvData.length
			: null;

	const avgSleep =
		sleepData.length > 0
			? sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length
			: null;

	// Calculate optimal number of exercises based on available time
	const calculateOptimalExerciseCount = (availableMinutes: number) => {
		// Assume average exercise takes:
		// - Compound: 3-4 sets × 45 seconds per set + rest time = ~6-8 minutes
		// - Isolation: 2-3 sets × 30 seconds per set + rest time = ~4-5 minutes
		// - Add 2 minutes transition time between exercises

		const avgCompoundTime = 7; // minutes
		const avgIsolationTime = 4.5; // minutes
		const transitionTime = 2; // minutes between exercises
		const warmupTime = 3; // minutes for warmup

		const workoutTime = availableMinutes - warmupTime;

		// Start with compound exercises (more time-consuming but more effective)
		let exerciseCount = 0;
		let timeUsed = 0;

		// For longer workouts, allow more compound exercises
		const maxCompounds = Math.min(
			Math.floor(availableMinutes / 20), // 1 compound per 20 minutes
			Math.floor(workoutTime / (avgCompoundTime + transitionTime))
		);
		exerciseCount += maxCompounds;
		timeUsed += maxCompounds * (avgCompoundTime + transitionTime);

		// Fill remaining time with isolation exercises
		const remainingTime = workoutTime - timeUsed;
		const additionalIsolation = Math.floor(
			remainingTime / (avgIsolationTime + transitionTime)
		);
		exerciseCount += additionalIsolation;

		// Ensure we have at least 3 exercises, but remove the max cap for longer workouts
		const minExercises = 3;
		const maxExercises = Math.max(12, Math.floor(availableMinutes / 8)); // ~1 exercise per 8 minutes

		return Math.max(minExercises, Math.min(maxExercises, exerciseCount));
	};

	const optimalExerciseCount = calculateOptimalExerciseCount(availableTime);
	console.log(
		`Calculated optimal exercise count: ${optimalExerciseCount} for ${availableTime} minutes`
	);

	// Create exercise options with context
	const exerciseOptions = userActiveExercises.map(
		({ userExercise, exercise }) => ({
			userExerciseId: userExercise.id,
			exerciseId: exercise.id,
			name: exercise.name,
			category: exercise.category,
			muscleGroups: exercise.muscleGroups,
			difficultyLevel: exercise.difficultyLevel,
			exerciseType: exercise.exerciseType,
			movementPattern: exercise.movementPattern,
			currentLevel: userExercise.currentLevel,
			currentWeight: userExercise.currentWeight,
			currentReps: userExercise.currentReps,
			currentSets: userExercise.currentSets,
			currentDuration: userExercise.currentDuration,
			lastPerformed: userExercise.lastPerformed,
			totalSessions: userExercise.totalSessions,
			baseRestTime: exercise.baseRestTime,
		})
	);

	// Extract conversation context for AI
	const conversationSummary = conversationContext
		? conversationContext
				.filter((msg) => msg.role === "user")
				.map((msg) => msg.content)
				.join(" ")
		: "";

	const prompt = `
You are Jack AI, an expert personal trainer creating a smart workout recommendation. The user just had a conversation with you about their workout preferences.

USER CONTEXT:
- Available Time: ${availableTime} minutes
- Energy Level: ${energyLevel ? `${energyLevel}/5` : "Not specified"}
- User Input: "${userInput || "None"}"
- Conversation Summary: "${conversationSummary || "None"}"
- Days Since Last Workout: ${daysSinceLastWorkout}
- Recent Average Difficulty: ${avgRecentDifficulty.toFixed(1)}/5
- Recent HRV: ${avgHrv ? avgHrv.toFixed(1) + "ms" : "Not available"}
- Recent Sleep: ${avgSleep ? (avgSleep / 60).toFixed(1) + " hours" : "Not available"}

RECENT MUSCLE GROUPS TRAINED: ${muscleGroupContext.join(", ") || "None"}

RECENT TRAINING SUMMARY:
${
	recentSessions.length > 0
		? recentSessions
				.map((session) => {
					const sessionDate = new Date(
						session.session.completedAt || new Date()
					);
					const hoursAgo = Math.round(
						(Date.now() - sessionDate.getTime()) / (1000 * 60 * 60)
					);
					const timeAgo =
						hoursAgo < 24
							? `${hoursAgo}h ago`
							: `${Math.floor(hoursAgo / 24)}d ${hoursAgo % 24}h ago`;

					const performances = session.performances as Array<{
						is_completed: boolean;
						difficulty_rating: number;
					}> | null;

					const completedExercises =
						performances?.filter((p) => p?.is_completed) || [];
					const avgDifficulty =
						completedExercises.length > 0
							? (
									completedExercises.reduce(
										(sum, p) => sum + (p.difficulty_rating || 0),
										0
									) / completedExercises.length
								).toFixed(1)
							: "N/A";

					return `- Session ${timeAgo}: ${completedExercises.length} exercises, avg difficulty ${avgDifficulty}/5`;
				})
				.join("\n")
		: "- No recent sessions"
}

RECOVERY INDICATORS:
- If HRV is low or sleep is poor, recommend lighter intensity
- If user trained hard recently (difficulty 4-5), consider recovery
- If user hasn't trained for 6+ days, can go harder but start moderate
- If user trained 7+ days straight, prioritize recovery

SMART PROGRAMMING RULES:
1. Avoid training the same muscle groups heavily if trained in last 48 hours
2. Balance push/pull movements and upper/lower body
3. Consider compound movements for time efficiency
4. Adapt intensity based on user's energy level and recovery markers
5. If user says "go hard" or "build arms", adjust focus accordingly
6. If user feels tired, choose easier exercises and lower volume
7. Use conversation context to understand user's specific goals for today

AVAILABLE EXERCISES:
${JSON.stringify(exerciseOptions, null, 2)}

Select EXACTLY ${optimalExerciseCount} exercises that fit the ${availableTime}-minute time constraint.

TIME CALCULATION GUIDANCE:
- Total available time: ${availableTime} minutes
- Reserve 3 minutes for warmup
- Compound exercises: ~7 minutes each (including rest)
- Isolation exercises: ~4.5 minutes each (including rest)
- Transition time: 2 minutes between exercises
- Your selected exercises should total approximately ${availableTime - 3} minutes

EXERCISE SELECTION PRIORITIES:
- Exercise order (compound first, isolation later)
- Muscle group balance and recovery
- Time efficiency for the available duration
- Progressive overload based on user's current levels
- Rest times appropriate for the exercise type and user's fitness level
- User's specific requests from the conversation

CRITICAL PROGRESSION RULES:
- ALWAYS use the "currentReps", "currentWeight", and "currentSets" values from each exercise as your baseline
- Do NOT deviate from these progression values unless there's a specific recovery reason
- The currentReps/currentWeight represent the user's current progression level after their feedback
- For weight-based exercises: use currentReps and currentWeight exactly as provided
- For time-based exercises: use currentDuration exactly as provided
- These values have been automatically adjusted based on the user's previous performance feedback

CRITICAL: For each exercise you select from the AVAILABLE EXERCISES list above:
- Use the "exerciseId" field value as the exerciseId in your response
- Use the "userExerciseId" field value as the userExerciseId in your response
- Do NOT swap these values or use exercise names as IDs
- Each exercise object in the list has both exerciseId and userExerciseId - use them exactly as shown

Example: If an exercise in the list shows:
{
  "userExerciseId": "abc123",
  "exerciseId": "def456",
  "name": "Bench Press"
}
Then in your response use:
{
  "userExerciseId": "abc123",
  "exerciseId": "def456"
}

Respond in ${userData.language === "no" ? "Norwegian" : userData.language === "es" ? "Spanish" : userData.language === "de" ? "German" : "English"}.
`;

	console.log("=== FULL AI PROMPT ===");
	console.log(prompt);
	console.log("=====================");

	const workoutRecommendationSchema =
		createWorkoutRecommendationSchema(optimalExerciseCount);

	const { object } = await generateObject({
		model: openai("gpt-4.1-2025-04-14"),
		schema: workoutRecommendationSchema,
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
		schemaName: "WorkoutRecommendation",
		schemaDescription: `AI-generated workout recommendation with exactly ${optimalExerciseCount} exercises for ${availableTime} minutes`,
	});

	console.log("=== AI RESPONSE ===");
	console.log("Session Reasoning:", object.sessionReasoning);
	console.log("Focus Areas:", object.focusAreas);
	console.log("Difficulty Level:", object.difficultyLevel);
	console.log("Estimated Duration:", object.estimatedDuration);
	console.log("Number of Exercises:", object.exercises.length);
	console.log("==================");

	return object;
}
