import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { waitlist } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		const { email, name } = await request.json();

		// Basic validation
		if (!email) {
			return NextResponse.json(
				{ message: "Email is required" },
				{ status: 400 }
			);
		}

		// Check if email already exists in waitlist
		const existingUser = await db
			.select()
			.from(waitlist)
			.where(eq(waitlist.email, email))
			.limit(1);

		// Check if any rows were returned
		if (existingUser.length > 0) {
			return NextResponse.json(
				{ message: "You're already on our waitlist!" },
				{ status: 200 }
			);
		}

		// Add to waitlist
		await db.insert(waitlist).values({
			id: crypto.randomUUID(),
			email,
			name,
			createdAt: new Date(),
			subscribedToNewsletter: true,
			source: "waitlist",
		});

		// Optional: Add to newsletter list
		try {
			// This could be an API call to your newsletter provider
			// Example: await addToNewsletter(email, name);
			console.log(`Added ${email} to newsletter list`);
		} catch (error) {
			console.error("Failed to add to newsletter:", error);
			// Continue execution - don't fail the request if newsletter fails
		}

		return NextResponse.json(
			{ message: "Successfully joined the waitlist!" },
			{ status: 201 }
		);
	} catch (error) {
		console.error("Waitlist error:", error);
		return NextResponse.json(
			{ message: "Failed to join waitlist. Please try again." },
			{ status: 500 }
		);
	}
}
