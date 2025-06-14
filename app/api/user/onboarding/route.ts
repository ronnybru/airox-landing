import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schema for onboarding data
const OnboardingUpdateSchema = z.object({
	gender: z.enum(["male", "female", "other"]).optional(),
	hearAboutUs: z
		.enum([
			"instagram",
			"facebook",
			"tiktok",
			"youtube",
			"google",
			"tv",
			"other",
		])
		.optional(),
	height: z.number().min(100).max(250).optional(), // cm
	weight: z.number().min(30).max(300).optional(), // kg
	isMetric: z.boolean().optional(),
	birthDate: z.string().datetime().optional(), // ISO string
	timezone: z.string().optional(), // User's timezone
	// Gym preferences
	gymFrequency: z.number().min(1).max(7).optional(), // times per week
	gymLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
	preferredFocus: z
		.enum(["strength", "muscle", "endurance", "general"])
		.optional(),
	injuries: z.string().optional(), // text input for AI to use
	iapTransactionId: z.string().optional(),
	subscriptionPlan: z.string().optional(),
	subscriptionStatus: z
		.enum(["trial", "active", "expired", "cancelled"])
		.optional(),
});

type UserUpdateData = {
	gender?: string;
	hearAboutUs?: string;
	height?: number;
	weight?: number;
	isMetric?: boolean;
	birthDate?: Date;
	timezone?: string;
	gymFrequency?: number;
	gymLevel?: string;
	preferredFocus?: string;
	injuries?: string;
	iapTransactionId?: string;
	subscriptionPlan?: string;
	subscriptionStatus?: string;
	subscriptionStartDate?: Date;
	subscriptionEndDate?: Date;
	onboardingCompleted?: boolean;
	updatedAt?: Date;
};

export async function POST(request: NextRequest) {
	try {
		// Get the session from the request
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Parse and validate the request body
		const body = await request.json();
		const validatedData = OnboardingUpdateSchema.parse(body);

		// Convert birthDate string to Date if provided
		const updateData: UserUpdateData = {
			...validatedData,
			birthDate: validatedData.birthDate
				? new Date(validatedData.birthDate)
				: undefined,
		};

		// Set subscription dates if this is a new subscription
		if (
			validatedData.subscriptionStatus === "trial" &&
			validatedData.subscriptionPlan
		) {
			const now = new Date();
			updateData.subscriptionStartDate = now;

			// Set trial end date (3 days from now)
			const trialEndDate = new Date(now);
			trialEndDate.setDate(trialEndDate.getDate() + 3);
			updateData.subscriptionEndDate = trialEndDate;
		}

		// Mark onboarding as completed if we have the essential data
		if (
			validatedData.gender ||
			validatedData.height ||
			validatedData.weight ||
			validatedData.birthDate
		) {
			updateData.onboardingCompleted = true;
		}

		// Add updatedAt timestamp
		updateData.updatedAt = new Date();

		// Update the user in the database
		const updatedUser = await db
			.update(user)
			.set(updateData)
			.where(eq(user.id, session.user.id))
			.returning({
				id: user.id,
				name: user.name,
				email: user.email,
				gender: user.gender,
				hearAboutUs: user.hearAboutUs,
				height: user.height,
				weight: user.weight,
				isMetric: user.isMetric,
				birthDate: user.birthDate,
				gymFrequency: user.gymFrequency,
				gymLevel: user.gymLevel,
				preferredFocus: user.preferredFocus,
				injuries: user.injuries,
				onboardingCompleted: user.onboardingCompleted,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionPlan: user.subscriptionPlan,
			});

		if (updatedUser.length === 0) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			user: updatedUser[0],
		});
	} catch (error) {
		console.error("Error updating user onboarding:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		// Get the session from the request
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the user's onboarding data
		const userData = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
			columns: {
				id: true,
				name: true,
				email: true,
				gender: true,
				hearAboutUs: true,
				height: true,
				weight: true,
				isMetric: true,
				birthDate: true,
				timezone: true,
				gymFrequency: true,
				gymLevel: true,
				preferredFocus: true,
				injuries: true,
				onboardingCompleted: true,
				subscriptionStatus: true,
				subscriptionPlan: true,
				subscriptionStartDate: true,
				subscriptionEndDate: true,
			},
		});

		if (!userData) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			user: userData,
		});
	} catch (error) {
		console.error("Error fetching user onboarding:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
