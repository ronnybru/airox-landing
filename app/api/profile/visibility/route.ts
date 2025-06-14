import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { isProfilePublic, publicUsername, bio, profileImageUrl } = body;

		// Validate required fields if making profile public
		if (isProfilePublic && !publicUsername) {
			return NextResponse.json(
				{ error: "Public username is required for public profiles" },
				{ status: 400 }
			);
		}

		// Check if username is already taken (if provided)
		if (publicUsername) {
			const existingUser = await db
				.select({ id: user.id })
				.from(user)
				.where(eq(user.publicUsername, publicUsername))
				.limit(1);

			if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
				return NextResponse.json(
					{ error: "Username is already taken" },
					{ status: 400 }
				);
			}
		}

		// Update user profile
		const [updatedUser] = await db
			.update(user)
			.set({
				isProfilePublic: isProfilePublic,
				publicUsername: publicUsername || null,
				bio: bio || null,
				profileImageUrl: profileImageUrl || null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id))
			.returning({
				id: user.id,
				isProfilePublic: user.isProfilePublic,
				publicUsername: user.publicUsername,
				bio: user.bio,
				profileImageUrl: user.profileImageUrl,
			});

		return NextResponse.json({
			success: true,
			profile: updatedUser,
		});
	} catch (error) {
		console.error("Error updating profile visibility:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

// Get current profile visibility settings
export async function GET(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Fetch user profile settings
		const [userProfile] = await db
			.select({
				id: user.id,
				isProfilePublic: user.isProfilePublic,
				publicUsername: user.publicUsername,
				bio: user.bio,
				profileImageUrl: user.profileImageUrl,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		return NextResponse.json({
			success: true,
			profile: userProfile,
		});
	} catch (error) {
		console.error("Error fetching profile visibility:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
