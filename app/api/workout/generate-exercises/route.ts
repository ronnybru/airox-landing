import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	exercises,
	bodyScans,
	user as userTable,
	userExercises,
	workoutRecommendations,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { getLocalizedExercise, getUserLanguage } from "@/lib/exercise-utils";

// Zod schema for exercise generation
const exerciseGenerationSchema = z.object({
	exercises: z
		.array(
			z.object({
				exerciseId: z
					.string()
					.describe("The ID of the exercise from the database"),
				recommendedSets: z
					.number()
					.min(1)
					.max(6)
					.describe("Recommended number of sets (1-6)"),
				recommendedReps: z
					.number()
					.min(0)
					.max(30)
					.describe(
						"Recommended number of reps (0-30, use 0 for time-based exercises)"
					),
				recommendedDuration: z
					.number()
					.min(0)
					.optional()
					.describe(
						"Recommended duration in seconds for time-based exercises (optional)"
					),
				recommendedWeight: z
					.number()
					.min(0)
					.describe(
						"Recommended weight in grams with increments of 2500g, 20 000g, 42 500g, 85 000g etc. (0 for bodyweight)"
					),
				reasoning: z
					.string()
					.describe(
						"Brief explanation for why this exercise and these parameters were chosen (in user's language)"
					),
			})
		)
		.length(15)
		.describe("Exactly 15 exercises selected for the user"),
	reasoning: z
		.string()
		.describe(
			"Tell the user a short story about the workout, and explain the reasoning behind the exercise selection. Be friendly and engaging. Based on the user's profile and goals, explain why these exercises were chosen. (In user's language)"
		),
	userProfile: z.object({
		fitnessLevel: z
			.string()
			.describe(
				"Assessed fitness level based on scan data (in user's language)"
			),
		goals: z
			.string()
			.describe(
				"Primary fitness goals based on user preferences (in user's language)"
			),
		limitations: z
			.array(z.string())
			.describe(
				"Any limitations or considerations from injuries (in user's language)"
			),
	}),
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

		// Get user's latest body scan with highest jack score from last 10 scans
		const latestScans = await db
			.select()
			.from(bodyScans)
			.where(
				and(
					eq(bodyScans.userId, userId),
					eq(bodyScans.analysisStatus, "completed")
				)
			)
			.orderBy(desc(bodyScans.createdAt))
			.limit(10);

		if (latestScans.length === 0) {
			return NextResponse.json(
				{
					error:
						"No completed body scans found. Please complete at least one body scan before generating exercises.",
				},
				{ status: 400 }
			);
		}

		// Find the scan with the highest jack score from the latest 10
		const bestScan = latestScans.reduce((best, current) =>
			(current.jackScore || 0) > (best.jackScore || 0) ? current : best
		);

		// Get all available exercises
		const availableExercises = await db
			.select()
			.from(exercises)
			.where(eq(exercises.isActive, true));

		if (availableExercises.length < 15) {
			return NextResponse.json(
				{
					error:
						"Not enough exercises available in the database. Please contact support.",
				},
				{ status: 400 }
			);
		}

		// Calculate user's age
		const age = userData.birthDate
			? Math.floor(
					(Date.now() - new Date(userData.birthDate).getTime()) /
						(365.25 * 24 * 60 * 60 * 1000)
				)
			: null;

		// Prepare data for AI
		const userProfile = {
			gender: userData.gender,
			age: age,
			gymLevel: userData.gymLevel,
			preferredFocus: userData.preferredFocus,
			injuries: userData.injuries,
			gymFrequency: userData.gymFrequency,
		};

		const scanData = {
			jackScore: bestScan.jackScore,
			muscleMass: bestScan.muscleMass ? bestScan.muscleMass / 1000 : null, // Convert to kg
			bodyFat: bestScan.bodyFatPercentage
				? bestScan.bodyFatPercentage / 100
				: null, // Convert to percentage
			analysisResults: bestScan.analysisResults,
		};

		// Create exercise list for AI
		const exerciseList = availableExercises.map((ex) => ({
			id: ex.id,
			name: ex.name,
			description: ex.description,
			category: ex.category,
			subcategory: ex.subcategory,
			muscleGroups: ex.muscleGroups,
			equipment: ex.equipment,
			difficultyLevel: ex.difficultyLevel,
			exerciseType: ex.exerciseType,
			movementPattern: ex.movementPattern,
			defaultSets: ex.defaultSets,
			defaultReps: ex.defaultReps,
			defaultDuration: ex.defaultDuration,
		}));

		// Language mapping for AI responses
		const languageInstructions = {
			en: "Respond in English",
			no: "Respond in Norwegian (Norsk)",
			es: "Respond in Spanish (Español)",
			de: "Respond in German (Deutsch)",
		};

		const userLanguage = userData.language || "en";
		const languageInstruction =
			languageInstructions[userLanguage as keyof typeof languageInstructions] ||
			languageInstructions.en;

		const prompt = `
You are an expert personal trainer and exercise physiologist. Based on the user's profile and latest body scan data, select exactly 15 exercises from the provided exercise database and recommend appropriate sets, reps, weights, and duration.

IMPORTANT: ${languageInstruction}. All reasoning text, fitness level assessment, goals, and limitations should be written in the user's language.

USER PROFILE:
- Gender: ${userProfile.gender || "Not specified"}
- Age: ${userProfile.age || "Not specified"}
- Gym Level: ${userProfile.gymLevel || "Not specified"}
- Preferred Focus: ${userProfile.preferredFocus || "Not specified"}
- Gym Frequency: ${userProfile.gymFrequency || "Not specified"} times per week
- Injuries/Limitations: ${userProfile.injuries || "None specified"}
- Language: ${userLanguage}

BODY SCAN DATA:
- Jack Score: ${scanData.jackScore || "Not available"}/1000 (bodybuilding potential score)
- Muscle Mass: ${scanData.muscleMass || "Not available"} kg
- Body Fat: ${scanData.bodyFat ? (scanData.bodyFat * 100).toFixed(1) + "%" : "Not available"}

EXERCISE SELECTION CRITERIA:
1. Select exactly 15 exercises that provide a well-rounded workout program
2. Consider the user's fitness level, goals, and any limitations
3. Ensure good muscle group balance (push/pull, upper/lower body)
4. Include both compound and isolation exercises appropriate for the user's level
5. Factor in the user's gym frequency to determine appropriate volume
6. Use the Jack Score and body composition data to assess current strength levels

REPS AND DURATION GUIDELINES:
- For rep-based exercises: Set recommendedReps to 1-30 and leave recommendedDuration empty
- For time-based exercises (planks, wall sits, etc.): Set recommendedReps to 0 and set recommendedDuration in seconds
- Examples of time-based exercises: Plank, Wall Sit, Dead Hang, Side Plank, etc.
- Check the exercise's defaultReps and defaultDuration fields to determine if it's time-based

WEIGHT RECOMMENDATIONS:
- For beginners: Start conservative, focus on form
- For intermediate: Moderate challenge, room for progression
- For advanced: Higher intensity based on scan data
- Consider body weight exercises (weight = 0) for appropriate movements
- Weight should be in grams (e.g., 20kg = 20000 grams)

AVAILABLE EXERCISES:
${JSON.stringify(exerciseList, null, 2)}

Provide exactly 15 exercises with specific recommendations tailored to this user's profile and scan data.
`;

		console.log("Generating exercise recommendations with AI...");

		const { object } = await generateObject({
			model: openai("gpt-4.1-2025-04-14"),
			schema: exerciseGenerationSchema,
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			schemaName: "ExerciseRecommendations",
			schemaDescription:
				"AI-generated exercise recommendations based on user profile and body scan data",
		});

		// Validate that all exercise IDs exist in our database
		const selectedExerciseIds = object.exercises.map((ex) => ex.exerciseId);
		const validExercises = availableExercises.filter((ex) =>
			selectedExerciseIds.includes(ex.id)
		);

		if (validExercises.length !== 15) {
			console.error("AI selected invalid exercise IDs");
			return NextResponse.json(
				{ error: "AI selected invalid exercises. Please try again." },
				{ status: 500 }
			);
		}

		// Enhance the response with localized exercise names
		const userLang = getUserLanguage(userData.language);
		const enhancedExercises = object.exercises.map((aiEx) => {
			const dbExercise = availableExercises.find(
				(ex) => ex.id === aiEx.exerciseId
			);
			if (!dbExercise) {
				return {
					...aiEx,
					name: "Unknown Exercise",
				};
			}

			const localizedExercise = getLocalizedExercise(dbExercise, userLang);
			return {
				...aiEx,
				name: localizedExercise.name,
			};
		});

		// Automatically apply the exercises to the user's workout
		try {
			// First, delete all existing user exercises
			await db.delete(userExercises).where(eq(userExercises.userId, userId));

			// Then, insert the new exercises
			const userExerciseData = enhancedExercises.map((exercise) => ({
				id: nanoid(),
				userId: userId,
				exerciseId: exercise.exerciseId,
				isActive: true,
				currentLevel: 1,
				currentWeight: exercise.recommendedWeight,
				baseReps: exercise.recommendedReps, // Set baseReps for step progression
				currentReps: exercise.recommendedReps,
				currentSets: exercise.recommendedSets,
				baseDuration: exercise.recommendedDuration, // Set baseDuration for step progression
				currentDuration: exercise.recommendedDuration || null,
				lastPerformed: null,
				totalSessions: 0,
				bestPerformance: null,
				preferredRestTime: null,
				notes: null,
				addedAt: new Date(),
				updatedAt: new Date(),
			}));

			await db.insert(userExercises).values(userExerciseData);

			// Store the AI reasoning in workout recommendations
			const validUntilDate = new Date();
			validUntilDate.setDate(validUntilDate.getDate() + 30); // Valid for 30 days

			const recommendationData = {
				id: nanoid(),
				userId: userId,
				sessionId: null, // Not tied to a specific session
				recommendationType: "daily",
				targetDuration: 60, // Default 60 minutes
				userInput: null,
				aiReasoning: object.reasoning,
				contextFactors: {
					userProfile: object.userProfile,
					scanData: scanData,
					exerciseCount: enhancedExercises.length,
				},
				recommendedExercises: enhancedExercises,
				alternativeExercises: null,
				confidenceScore: 85, // Default confidence
				expectedDifficulty: 5, // Default difficulty
				focusAreas: [
					...new Set(
						enhancedExercises.flatMap((ex) => {
							const dbEx = availableExercises.find(
								(e) => e.id === ex.exerciseId
							);
							return dbEx?.muscleGroups || [];
						})
					),
				],
				status: "accepted",
				isUsed: true,
				userFeedback: null,
				validUntil: validUntilDate,
				createdAt: new Date(),
			};

			await db.insert(workoutRecommendations).values(recommendationData);

			console.log(
				`Auto-applied ${userExerciseData.length} exercises for user ${userId} and stored AI reasoning`
			);
		} catch (applyError) {
			console.error("Error auto-applying exercises:", applyError);
			// Don't fail the whole request if auto-apply fails
		}

		const result = {
			...object,
			exercises: enhancedExercises,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error generating exercises:", error);
		return NextResponse.json(
			{ error: "Failed to generate exercise recommendations" },
			{ status: 500 }
		);
	}
}
