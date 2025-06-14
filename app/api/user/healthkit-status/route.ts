import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Schema for HealthKit status update
const healthKitStatusSchema = z.object({
	connected: z.boolean(),
	lastConnected: z
		.string()
		.optional()
		.transform((str) => (str ? new Date(str) : undefined)),
	lastDisconnected: z
		.string()
		.optional()
		.transform((str) => (str ? new Date(str) : undefined)),
});

// PATCH - Update user's HealthKit connection status
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = healthKitStatusSchema.parse(body);

		// Update user's HealthKit status in database
		const updateData: {
			healthKitConnected: boolean;
			updatedAt: Date;
			healthKitLastConnected?: Date;
			healthKitLastDisconnected?: Date;
		} = {
			healthKitConnected: validatedData.connected,
			updatedAt: new Date(),
		};

		if (validatedData.lastConnected) {
			updateData.healthKitLastConnected = validatedData.lastConnected;
		}

		if (validatedData.lastDisconnected) {
			updateData.healthKitLastDisconnected = validatedData.lastDisconnected;
		}

		await db.update(user).set(updateData).where(eq(user.id, session.user.id));

		console.log(`✅ Updated HealthKit status for user ${session.user.id}:`, {
			connected: validatedData.connected,
			lastConnected: validatedData.lastConnected?.toISOString(),
			lastDisconnected: validatedData.lastDisconnected?.toISOString(),
		});

		return NextResponse.json({
			success: true,
			message: "HealthKit status updated successfully",
		});
	} catch (error) {
		console.error("❌ Failed to update HealthKit status:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to update HealthKit status" },
			{ status: 500 }
		);
	}
}

// GET - Get user's HealthKit connection status
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userData = await db
			.select({
				healthKitConnected: user.healthKitConnected,
				healthKitLastConnected: user.healthKitLastConnected,
				healthKitLastDisconnected: user.healthKitLastDisconnected,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!userData.length) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			data: userData[0],
		});
	} catch (error) {
		console.error("❌ Failed to get HealthKit status:", error);
		return NextResponse.json(
			{ error: "Failed to get HealthKit status" },
			{ status: 500 }
		);
	}
}
