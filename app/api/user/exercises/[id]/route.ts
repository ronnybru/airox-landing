import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userExercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: userExerciseId } = await params;
		const body = await request.json();

		// Update the user exercise
		const updatedUserExercise = await db
			.update(userExercises)
			.set({
				...body,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(userExercises.id, userExerciseId),
					eq(userExercises.userId, session.user.id)
				)
			)
			.returning();

		if (updatedUserExercise.length === 0) {
			return NextResponse.json(
				{ error: "User exercise not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(updatedUserExercise[0]);
	} catch (error) {
		console.error("Failed to update user exercise:", error);
		return NextResponse.json(
			{ error: "Failed to update user exercise" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: userExerciseId } = await params;

		// Delete the user exercise
		const deletedUserExercise = await db
			.delete(userExercises)
			.where(
				and(
					eq(userExercises.id, userExerciseId),
					eq(userExercises.userId, session.user.id)
				)
			)
			.returning();

		if (deletedUserExercise.length === 0) {
			return NextResponse.json(
				{ error: "User exercise not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete user exercise:", error);
		return NextResponse.json(
			{ error: "Failed to delete user exercise" },
			{ status: 500 }
		);
	}
}
