import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exercises, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
	getLocalizedExercise,
	getUserLanguage,
	type SupportedLanguage,
} from "@/lib/exercise-utils";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id: exerciseId } = await params;

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

		// Localize exercise based on user's language preference
		const localizedExercise = getLocalizedExercise(
			exercise[0],
			userLanguage as SupportedLanguage
		);

		return NextResponse.json(localizedExercise);
	} catch (error) {
		console.error("Failed to fetch exercise:", error);
		return NextResponse.json(
			{ error: "Failed to fetch exercise" },
			{ status: 500 }
		);
	}
}
