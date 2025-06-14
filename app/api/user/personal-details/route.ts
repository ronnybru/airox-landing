import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userData = await db
			.select({
				weight: user.weight, // Using existing weight field
				height: user.height,
				birthDate: user.birthDate,
				gender: user.gender,
				isMetric: user.isMetric,
				timezone: user.timezone,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!userData.length) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Return the data as stored in database (always metric) with user preference
		const result = {
			weight: userData[0].weight, // Always in kg
			height: userData[0].height, // Always in cm
			birthDate: userData[0].birthDate?.toISOString().split("T")[0] || null,
			gender: userData[0].gender,
			isMetric: userData[0].isMetric ?? true,
			timezone: userData[0].timezone || "UTC",
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("Get personal details error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { weight, height, birthDate, gender, isMetric, timezone } = body;

		// Validate the data
		const updateData: Record<string, string | number | Date | boolean> = {};

		if (weight !== undefined) {
			if (typeof weight !== "number" || weight <= 0) {
				return NextResponse.json(
					{ error: "Invalid current weight" },
					{ status: 400 }
				);
			}
			// Always store weight in kg (frontend handles conversion)
			updateData.weight = Math.round(weight);
		}

		if (height !== undefined) {
			if (typeof height !== "number" || height <= 0) {
				return NextResponse.json({ error: "Invalid height" }, { status: 400 });
			}
			// Always store height in cm (frontend handles conversion)
			updateData.height = Math.round(height);
		}

		if (birthDate !== undefined) {
			if (typeof birthDate !== "string") {
				return NextResponse.json(
					{ error: "Invalid birth date" },
					{ status: 400 }
				);
			}
			// Convert string to Date object for database storage
			const parsedDate = new Date(birthDate);
			if (isNaN(parsedDate.getTime())) {
				return NextResponse.json(
					{ error: "Invalid birth date format" },
					{ status: 400 }
				);
			}
			updateData.birthDate = parsedDate;
		}

		if (gender !== undefined) {
			if (!["male", "female", "other"].includes(gender)) {
				return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
			}
			updateData.gender = gender;
		}

		if (isMetric !== undefined) {
			if (typeof isMetric !== "boolean") {
				return NextResponse.json(
					{ error: "Invalid metric preference" },
					{ status: 400 }
				);
			}
			updateData.isMetric = isMetric;
		}

		if (timezone !== undefined) {
			if (typeof timezone !== "string" || timezone.length === 0) {
				return NextResponse.json(
					{ error: "Invalid timezone" },
					{ status: 400 }
				);
			}
			updateData.timezone = timezone;
		}

		// Update the user
		await db
			.update(user)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Update personal details error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
