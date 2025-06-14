import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
	getLocalizedExercises,
	getUserLanguage,
	type SupportedLanguage,
} from "@/lib/exercise-utils";

export async function GET(request: NextRequest) {
	try {
		console.log("GET /api/exercises called");

		// Get user session to determine language preference
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		let userLanguage = "en";
		if (session?.user?.id) {
			const userData = await db
				.select({ language: user.language })
				.from(user)
				.where(eq(user.id, session.user.id))
				.limit(1);

			if (userData.length > 0) {
				userLanguage = getUserLanguage(userData[0].language);
			}
		}

		const allExercises = await db
			.select()
			.from(exercises)
			.where(eq(exercises.isActive, true))
			.orderBy(asc(exercises.name));

		// Localize exercises based on user's language preference
		const localizedExercises = getLocalizedExercises(
			allExercises,
			userLanguage as SupportedLanguage
		);

		console.log(
			"Found exercises:",
			localizedExercises.length,
			"Language:",
			userLanguage
		);
		return NextResponse.json(localizedExercises);
	} catch (error) {
		console.error("Failed to fetch exercises:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exercises" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		console.log("POST /api/exercises called");

		// Get user session for authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		console.log("Creating custom exercise:", body);

		// Validate required fields
		const {
			name,
			description,
			instructions,
			category,
			muscleGroups,
			equipment,
			exerciseType,
			difficultyLevel,
			defaultSets,
			defaultReps,
			defaultDuration,
			progressionType,
			baseTimePerSet,
			baseRestTime,
			tags,
		} = body;

		if (!name || !description || !category || !muscleGroups || !equipment) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Generate a unique ID for the exercise
		const exerciseId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Create the exercise in the database
		const newExercise = await db
			.insert(exercises)
			.values({
				id: exerciseId,
				name,
				description,
				instructions: instructions || "",
				// Set localized fields to the same values for now
				nameEn: name,
				descriptionEn: description,
				instructionsEn: instructions || "",
				category,
				muscleGroups,
				equipment,
				exerciseType: exerciseType || "compound",
				difficultyLevel: difficultyLevel || 5,
				defaultSets: defaultSets || 3,
				defaultReps: progressionType === "time" ? null : defaultReps || 10,
				defaultDuration:
					progressionType === "time" ? defaultDuration || 30 : null,
				progressionType: progressionType || "weight",
				baseTimePerSet: baseTimePerSet || 60,
				baseRestTime: baseRestTime || 60,
				tags: tags || ["custom", "user_created"],
				isActive: true,
				createdBy: session.user.id,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		console.log("Created custom exercise:", newExercise[0]);
		return NextResponse.json(newExercise[0]);
	} catch (error) {
		console.error("Failed to create custom exercise:", error);
		return NextResponse.json(
			{ error: "Failed to create custom exercise" },
			{ status: 500 }
		);
	}
}
