import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { seedExercises } from "@/app/(admin)/exercises/actions";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// For now, allow any authenticated user to seed exercises
		// In production, you might want to restrict this to admins only
		const result = await seedExercises();

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error seeding exercises:", error);
		return NextResponse.json(
			{ error: "Failed to seed exercises" },
			{ status: 500 }
		);
	}
}
