import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { healthData, healthScores, healthInsights } from "@/lib/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { z } from "zod";

// Schema for health data submission
const healthDataSchema = z.object({
	dataType: z.enum(["steps", "sleep", "heart_rate", "hrv", "active_minutes"]),
	value: z.number(),
	unit: z.string(),
	additionalData: z.record(z.any()).optional(),
	recordedAt: z.string().transform((str) => new Date(str)),
	source: z.string().optional(),
	deviceType: z.string().optional(),
});

const bulkHealthDataSchema = z.array(healthDataSchema);

// GET - Retrieve user's health data
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const dataType = searchParams.get("dataType");
		const days = parseInt(searchParams.get("days") || "7");
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		let whereConditions = and(
			eq(healthData.userId, session.user.id),
			gte(healthData.recordedAt, startDate)
		);

		if (dataType) {
			whereConditions = and(
				eq(healthData.userId, session.user.id),
				eq(
					healthData.dataType,
					dataType as
						| "steps"
						| "sleep"
						| "heart_rate"
						| "hrv"
						| "active_minutes"
				),
				gte(healthData.recordedAt, startDate)
			);
		}

		const data = await db
			.select()
			.from(healthData)
			.where(whereConditions)
			.orderBy(desc(healthData.recordedAt));

		return NextResponse.json({ data });
	} catch (error) {
		console.error("Error fetching health data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch health data" },
			{ status: 500 }
		);
	}
}

// POST - Store health data
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Support both single and bulk data submission
		const isArray = Array.isArray(body);
		const healthDataArray = isArray ? body : [body];

		// Validate the data
		const validatedData = bulkHealthDataSchema.parse(healthDataArray);

		// Prepare data for insertion
		const dataToInsert = validatedData.map((item) => ({
			id: crypto.randomUUID(),
			userId: session.user.id,
			dataType: item.dataType,
			value: item.value, // Store decimal values directly
			unit: item.unit,
			additionalData: item.additionalData,
			recordedAt: item.recordedAt,
			source: item.source || "mobile_app",
			deviceType: item.deviceType,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));

		// Insert data with upsert logic to handle duplicates
		// For each item, try to insert or update if exists
		for (const item of dataToInsert) {
			await db
				.insert(healthData)
				.values(item)
				.onConflictDoUpdate({
					target: [
						healthData.userId,
						healthData.dataType,
						healthData.recordedAt,
						healthData.source,
					],
					set: {
						value: item.value,
						unit: item.unit,
						additionalData: item.additionalData,
						deviceType: item.deviceType,
						updatedAt: new Date(),
					},
				});
		}

		// Calculate and update health scores if we have enough data
		await calculateAndStoreHealthScore(session.user.id);

		// Generate insights if needed
		await generateHealthInsights(session.user.id);

		return NextResponse.json({
			success: true,
			message: `${dataToInsert.length} health data points stored successfully`,
		});
	} catch (error) {
		console.error("Error storing health data:", error);
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid data format", details: error.errors },
				{ status: 400 }
			);
		}
		return NextResponse.json(
			{ error: "Failed to store health data" },
			{ status: 500 }
		);
	}
}

// Helper function to calculate and store health score
async function calculateAndStoreHealthScore(userId: string) {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const sevenDaysAgo = new Date(today);
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		// Get recent health data
		const recentData = await db
			.select()
			.from(healthData)
			.where(
				and(
					eq(healthData.userId, userId),
					gte(healthData.recordedAt, sevenDaysAgo)
				)
			);

		if (recentData.length === 0) return;

		// Group data by type
		const dataByType = recentData.reduce(
			(acc, item) => {
				if (!acc[item.dataType]) acc[item.dataType] = [];
				acc[item.dataType].push(item);
				return acc;
			},
			{} as Record<string, typeof recentData>
		);

		// Calculate component scores
		const sleepScore = calculateSleepScore(dataByType.sleep || []);
		const activityScore = calculateActivityScore(
			dataByType.steps || [],
			dataByType.active_minutes || []
		);
		const recoveryScore = calculateRecoveryScore(
			dataByType.sleep || [],
			dataByType.hrv || []
		);

		// Calculate overall score (weighted average)
		const overallScore = Math.round(
			sleepScore * 0.4 + activityScore * 0.35 + recoveryScore * 0.25
		);

		// Check if score already exists for today
		const existingScore = await db
			.select()
			.from(healthScores)
			.where(
				and(eq(healthScores.userId, userId), gte(healthScores.date, today))
			)
			.limit(1);

		const scoreData = {
			userId,
			date: today,
			overallScore,
			sleepScore,
			activityScore,
			recoveryScore,
			stepGoalAchieved: checkStepGoalAchieved(dataByType.steps || []),
			sleepGoalAchieved: checkSleepGoalAchieved(dataByType.sleep || []),
			activeMinutesGoalAchieved: checkActiveMinutesGoalAchieved(
				dataByType.active_minutes || []
			),
			dataCompleteness: calculateDataCompleteness(dataByType),
			updatedAt: new Date(),
		};

		if (existingScore.length > 0) {
			// Update existing score
			await db
				.update(healthScores)
				.set(scoreData)
				.where(eq(healthScores.id, existingScore[0].id));
		} else {
			// Insert new score
			await db.insert(healthScores).values({
				id: crypto.randomUUID(),
				createdAt: new Date(),
				...scoreData,
			});
		}
	} catch (error) {
		console.error("Error calculating health score:", error);
	}
}

// Helper function to generate health insights
async function generateHealthInsights(userId: string) {
	try {
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		// Get recent health data
		const recentData = await db
			.select()
			.from(healthData)
			.where(
				and(
					eq(healthData.userId, userId),
					gte(healthData.recordedAt, sevenDaysAgo)
				)
			);

		if (recentData.length === 0) return;

		// Group data by type
		const dataByType = recentData.reduce(
			(acc, item) => {
				if (!acc[item.dataType]) acc[item.dataType] = [];
				acc[item.dataType].push(item);
				return acc;
			},
			{} as Record<string, typeof recentData>
		);

		const insights = [];

		// Sleep insights
		const sleepData = dataByType.sleep || [];
		if (sleepData.length > 0) {
			const avgSleep =
				sleepData.reduce((sum, item) => sum + item.value, 0) / sleepData.length;

			if (avgSleep < 420) {
				// Less than 7 hours
				insights.push({
					id: crypto.randomUUID(),
					userId,
					insightType: "sleep_quality",
					title: "Improve Sleep Duration",
					description: `Your average sleep is ${(avgSleep / 60).toFixed(1)} hours. Aim for 7-9 hours for optimal recovery and body composition improvements.`,
					score: Math.round((avgSleep / 480) * 100),
					priority: avgSleep < 360 ? "high" : "medium",
					category: "sleep",
					recommendations: [
						"Set a consistent bedtime routine",
						"Avoid screens 1 hour before bed",
						"Keep your bedroom cool (65-68°F)",
						"Consider a sleep tracking device for better insights",
					],
					validFrom: new Date(),
					isRead: false,
					createdAt: new Date(),
				});
			}
		}

		// Activity insights
		const stepsData = dataByType.steps || [];
		if (stepsData.length > 0) {
			const avgSteps =
				stepsData.reduce((sum, item) => sum + item.value, 0) / stepsData.length;

			if (avgSteps < 8000) {
				insights.push({
					id: crypto.randomUUID(),
					userId,
					insightType: "activity_trend",
					title: "Increase Daily Activity",
					description: `Your average daily steps is ${Math.round(avgSteps)}. Try to reach 10,000 steps daily for better health.`,
					score: Math.round((avgSteps / 10000) * 100),
					priority: avgSteps < 5000 ? "high" : "medium",
					category: "activity",
					recommendations: [
						"Take walking breaks every hour",
						"Use stairs instead of elevators",
						"Park further away from destinations",
						"Try walking meetings or phone calls",
					],
					validFrom: new Date(),
					isRead: false,
					createdAt: new Date(),
				});
			}
		}

		// Insert insights if any were generated
		if (insights.length > 0) {
			await db.insert(healthInsights).values(insights);
		}
	} catch (error) {
		console.error("Error generating health insights:", error);
	}
}

// Helper functions for score calculations
interface HealthDataItem {
	value: number;
	recordedAt: Date;
}

function calculateSleepScore(sleepData: HealthDataItem[]): number {
	if (sleepData.length === 0) return 0;

	const avgDuration =
		sleepData.reduce((sum, item) => sum + item.value, 0) / sleepData.length;

	// Duration score (optimal: 7-9 hours = 420-540 minutes)
	let durationScore = 0;
	if (avgDuration >= 420 && avgDuration <= 540) {
		durationScore = 100;
	} else if (avgDuration >= 360 && avgDuration < 420) {
		durationScore = 80;
	} else if (avgDuration >= 300 && avgDuration < 360) {
		durationScore = 60;
	} else if (avgDuration < 300) {
		durationScore = 30;
	} else {
		durationScore = 85;
	}

	return Math.round(durationScore);
}

function calculateActivityScore(
	stepsData: HealthDataItem[],
	activeMinutesData: HealthDataItem[]
): number {
	if (stepsData.length === 0) return 0;

	const avgSteps =
		stepsData.reduce((sum, item) => sum + item.value, 0) / stepsData.length;
	const avgActiveMinutes =
		activeMinutesData.length > 0
			? activeMinutesData.reduce((sum, item) => sum + item.value, 0) /
				activeMinutesData.length
			: 0;

	const stepsScore = Math.min(100, (avgSteps / 10000) * 100);
	const activeScore = Math.min(100, (avgActiveMinutes / 30) * 100);

	return Math.round(stepsScore * 0.7 + activeScore * 0.3);
}

function calculateRecoveryScore(
	sleepData: HealthDataItem[],
	hrvData: HealthDataItem[]
): number {
	let score = 75; // Base score

	if (hrvData.length > 0) {
		const avgHRV =
			hrvData.reduce((sum, item) => sum + item.value, 0) / hrvData.length;
		const hrvScore = Math.min(100, (avgHRV / 50) * 100);
		score = score * 0.7 + hrvScore * 0.3;
	}

	return Math.round(Math.min(100, Math.max(0, score)));
}

function calculateDataCompleteness(
	dataByType: Record<string, HealthDataItem[]>
): number {
	const expectedTypes = ["sleep", "steps", "active_minutes"];
	let availableTypes = 0;

	expectedTypes.forEach((type) => {
		if (dataByType[type] && dataByType[type].length > 0) {
			availableTypes++;
		}
	});

	return Math.round((availableTypes / expectedTypes.length) * 100);
}

// Goal checking functions
function checkStepGoalAchieved(stepsData: HealthDataItem[]): boolean {
	if (stepsData.length === 0) return false;
	const todaySteps = stepsData[stepsData.length - 1]?.value || 0;
	return todaySteps >= 10000; // Default goal
}

function checkSleepGoalAchieved(sleepData: HealthDataItem[]): boolean {
	if (sleepData.length === 0) return false;
	const lastSleep = sleepData[sleepData.length - 1]?.value || 0;
	return lastSleep >= 420; // 7 hours default goal
}

function checkActiveMinutesGoalAchieved(
	activeMinutesData: HealthDataItem[]
): boolean {
	if (activeMinutesData.length === 0) return false;
	const todayActiveMinutes =
		activeMinutesData[activeMinutesData.length - 1]?.value || 0;
	return todayActiveMinutes >= 30; // Default goal
}
