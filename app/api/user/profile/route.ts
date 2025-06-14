import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, language, isPublic, publicUsername, bio, socialLinks } = body;

		// Validate language if provided
		if (language && !["en", "no", "es", "de"].includes(language)) {
			return NextResponse.json(
				{ error: "Invalid language. Supported languages: en, no, es, de" },
				{ status: 400 }
			);
		}

		// Validate public username if provided
		if (publicUsername !== undefined) {
			if (publicUsername && typeof publicUsername !== "string") {
				return NextResponse.json(
					{ error: "Public username must be a string" },
					{ status: 400 }
				);
			}

			if (publicUsername && publicUsername.length < 3) {
				return NextResponse.json(
					{ error: "Public username must be at least 3 characters long" },
					{ status: 400 }
				);
			}

			if (publicUsername && publicUsername.length > 30) {
				return NextResponse.json(
					{ error: "Public username must be no more than 30 characters long" },
					{ status: 400 }
				);
			}

			if (publicUsername && !/^[a-zA-Z0-9_-]+$/.test(publicUsername)) {
				return NextResponse.json(
					{
						error:
							"Public username can only contain letters, numbers, underscores, and hyphens",
					},
					{ status: 400 }
				);
			}

			// Check if username is already taken (if not null and different from current user's username)
			if (publicUsername) {
				const existingUser = await db
					.select({ id: user.id })
					.from(user)
					.where(eq(user.publicUsername, publicUsername))
					.limit(1);

				if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
					return NextResponse.json(
						{ error: "This username is already taken" },
						{ status: 409 }
					);
				}
			}
		}

		// Validate bio if provided
		if (bio !== undefined && bio && bio.length > 500) {
			return NextResponse.json(
				{ error: "Bio must be no more than 500 characters long" },
				{ status: 400 }
			);
		}

		// Validate social links if provided
		if (socialLinks !== undefined) {
			if (socialLinks && typeof socialLinks !== "object") {
				return NextResponse.json(
					{ error: "Social links must be an object" },
					{ status: 400 }
				);
			}

			// Validate each social link
			if (socialLinks) {
				const validPlatforms = ["instagram", "facebook", "tiktok", "x"];
				for (const [platform, url] of Object.entries(socialLinks)) {
					if (!validPlatforms.includes(platform)) {
						return NextResponse.json(
							{ error: `Invalid social platform: ${platform}` },
							{ status: 400 }
						);
					}
					if (url && typeof url !== "string") {
						return NextResponse.json(
							{ error: `Social link for ${platform} must be a string` },
							{ status: 400 }
						);
					}
					if (url && (url as string).length > 200) {
						return NextResponse.json(
							{
								error: `Social link for ${platform} must be no more than 200 characters`,
							},
							{ status: 400 }
						);
					}
				}
			}
		}

		// Build update object with only provided fields
		const updateData: Partial<{
			name: string;
			language: string;
			isProfilePublic: boolean;
			publicUsername: string | null;
			bio: string | null;
			socialLinks: object | null;
		}> = {};
		if (name !== undefined) updateData.name = name;
		if (language !== undefined) updateData.language = language;
		if (isPublic !== undefined) updateData.isProfilePublic = isPublic;
		if (publicUsername !== undefined)
			updateData.publicUsername = publicUsername || null;
		if (bio !== undefined) updateData.bio = bio || null;
		if (socialLinks !== undefined) updateData.socialLinks = socialLinks || null;

		if (Object.keys(updateData).length === 0) {
			return NextResponse.json(
				{ error: "No valid fields provided for update" },
				{ status: 400 }
			);
		}

		// Update user in database
		await db
			.update(user)
			.set({
				...updateData,
				updatedAt: new Date(),
			})
			.where(eq(user.id, session.user.id));

		return NextResponse.json({
			success: true,
			message: "Profile updated successfully",
		});
	} catch (error) {
		console.error("Profile update error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user profile from database
		const userProfile = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				language: user.language,
				isProfilePublic: user.isProfilePublic,
				publicUsername: user.publicUsername,
				bio: user.bio,
				socialLinks: user.socialLinks,
				gender: user.gender,
				height: user.height,
				weight: user.weight,
				isMetric: user.isMetric,
				birthDate: user.birthDate,
				onboardingCompleted: user.onboardingCompleted,
			})
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (!userProfile.length) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json(userProfile[0]);
	} catch (error) {
		console.error("Profile fetch error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
