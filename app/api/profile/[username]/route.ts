import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, bodyScans } from "@/lib/db/schema";
import { eq, and, isNotNull, sql, max, count } from "drizzle-orm";
import { getImageUrl } from "@/lib/s3";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ username: string }> }
) {
	try {
		const { username } = await params;

		console.log(`👤 [API] Fetching profile for username: ${username}`);

		// First, find the user by public username
		const userData = await db
			.select({
				id: user.id,
				publicUsername: user.publicUsername,
				isProfilePublic: user.isProfilePublic,
				bio: user.bio,
				socialLinks: user.socialLinks,
				createdAt: user.createdAt,
			})
			.from(user)
			.where(
				and(eq(user.publicUsername, username), eq(user.isProfilePublic, true))
			)
			.limit(1);

		if (userData.length === 0) {
			console.log(`👤 [API] Profile not found for username: ${username}`);
			return NextResponse.json(
				{
					success: false,
					error: "Profile not found",
				},
				{ status: 404 }
			);
		}

		const userProfile = userData[0];

		// Get user's best jackScore and the scan image for that score
		const bestScoreData = await db
			.select({
				bestJackScore: max(bodyScans.jackScore).as("bestJackScore"),
			})
			.from(bodyScans)
			.where(
				and(
					eq(bodyScans.userId, userProfile.id),
					isNotNull(bodyScans.jackScore),
					eq(bodyScans.analysisStatus, "completed")
				)
			);

		const bestJackScore = bestScoreData[0]?.bestJackScore || 0;

		// Get the complete scan data for the best score (earliest scan with that score)
		const bestScanData = await db
			.select()
			.from(bodyScans)
			.where(
				and(
					eq(bodyScans.userId, userProfile.id),
					eq(bodyScans.jackScore, bestJackScore),
					eq(bodyScans.analysisStatus, "completed")
				)
			)
			.orderBy(bodyScans.createdAt) // Get the earliest scan with the best score
			.limit(1);

		// Get total scan count
		const totalScansData = await db
			.select({
				count: count(bodyScans.id).as("count"),
			})
			.from(bodyScans)
			.where(
				and(
					eq(bodyScans.userId, userProfile.id),
					eq(bodyScans.analysisStatus, "completed")
				)
			);

		const totalScans = Number(totalScansData[0]?.count) || 0;

		// Get user's rank by counting users with higher scores
		const rankData = await db
			.select({
				rank: sql<number>`count(*) + 1`.as("rank"),
			})
			.from(
				db
					.select({
						userId: bodyScans.userId,
						bestScore: max(bodyScans.jackScore).as("bestScore"),
					})
					.from(bodyScans)
					.where(
						and(
							isNotNull(bodyScans.jackScore),
							eq(bodyScans.analysisStatus, "completed")
						)
					)
					.groupBy(bodyScans.userId)
					.having(sql`max(${bodyScans.jackScore}) > ${bestJackScore}`)
					.as("higherScores")
			);

		const rank = Number(rankData[0]?.rank) || 1;

		// Process the best scan data if available
		let bestScanProcessed = null;
		if (bestScanData[0]) {
			const scan = bestScanData[0];
			bestScanProcessed = {
				...scan,
				imageUrl: await getImageUrl(scan.imageUrl, true), // Public profile, so use public access
			};
		}

		const profile = {
			id: userProfile.id,
			publicUsername: userProfile.publicUsername,
			bio: userProfile.bio,
			socialLinks: userProfile.socialLinks,
			bestJackScore: Number(bestJackScore),
			bestScanImageUrl: bestScanData[0]?.imageUrl
				? await getImageUrl(bestScanData[0].imageUrl, true) // Public profile, so use public access
				: null,
			bestScanData: bestScanProcessed,
			totalScans,
			joinedDate: userProfile.createdAt,
			rank,
		};

		console.log(`👤 [API] Profile found:`, {
			username: profile.publicUsername,
			bestScore: profile.bestJackScore,
			totalScans: profile.totalScans,
			rank: profile.rank,
			hasImage: !!profile.bestScanImageUrl,
			hasBestScanData: !!profile.bestScanData,
			hasBio: !!profile.bio,
			hasSocialLinks: !!profile.socialLinks,
		});

		return NextResponse.json({
			success: true,
			profile,
		});
	} catch (error) {
		console.error("👤 [API] Error fetching profile:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
