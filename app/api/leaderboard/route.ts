import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, bodyScans } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, sql, max } from "drizzle-orm";
import { getImageUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const publicOnly = searchParams.get("publicOnly") === "true";
		const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 200); // Max 200, default 20
		const offset = parseInt(searchParams.get("offset") || "0");
		const sortBy = searchParams.get("sortBy") || "jackScore-desc"; // Default sort by jackScore descending

		console.log(
			`🏆 [API] Fetching leaderboard with publicOnly=${publicOnly}, limit=${limit}, offset=${offset}, sortBy=${sortBy}`
		);

		// First, get each user's best jackScore with their best scan details
		const bestScoresSubquery = db
			.select({
				userId: bodyScans.userId,
				bestJackScore: max(bodyScans.jackScore).as("bestJackScore"),
			})
			.from(bodyScans)
			.where(
				and(
					isNotNull(bodyScans.jackScore),
					eq(bodyScans.analysisStatus, "completed")
				)
			)
			.groupBy(bodyScans.userId)
			.as("bestScores");

		// Then get the full leaderboard data with user info and best scan image
		const leaderboardQuery = db
			.select({
				id: user.id,
				publicUsername: user.publicUsername,
				isProfilePublic: user.isProfilePublic,
				bestJackScore: bestScoresSubquery.bestJackScore,
				bestScanImageUrl: bodyScans.imageUrl,
				totalScans: sql<number>`count(${bodyScans.id})`.as("totalScans"),
				joinedDate: user.createdAt,
			})
			.from(bestScoresSubquery)
			.innerJoin(user, eq(bestScoresSubquery.userId, user.id))
			.leftJoin(
				bodyScans,
				and(
					eq(bodyScans.userId, user.id),
					eq(bodyScans.jackScore, bestScoresSubquery.bestJackScore),
					eq(bodyScans.analysisStatus, "completed"),
					// Only get the earliest scan with the best score
					sql`${bodyScans.id} = (
						SELECT id FROM ${bodyScans} bs2
						WHERE bs2.user_id = ${user.id}
						AND bs2.jack_score = ${bestScoresSubquery.bestJackScore}
						AND bs2.analysis_status = 'completed'
						ORDER BY bs2.created_at ASC
						LIMIT 1
					)`
				)
			)
			.where(
				publicOnly
					? and(eq(user.isProfilePublic, true), isNotNull(user.publicUsername))
					: undefined
			)
			.groupBy(
				user.id,
				user.publicUsername,
				user.isProfilePublic,
				bestScoresSubquery.bestJackScore,
				bodyScans.imageUrl,
				user.createdAt
			)
			.orderBy(
				// Dynamic sorting based on sortBy parameter
				...(sortBy === "jackScore-asc"
					? [bestScoresSubquery.bestJackScore, user.createdAt]
					: sortBy === "joinedDate-asc"
						? [user.createdAt, desc(bestScoresSubquery.bestJackScore)]
						: sortBy === "joinedDate-desc"
							? [desc(user.createdAt), desc(bestScoresSubquery.bestJackScore)]
							: [desc(bestScoresSubquery.bestJackScore), user.createdAt]) // Default: jackScore-desc
			)
			.limit(limit)
			.offset(offset);

		const leaderboardData = await leaderboardQuery;

		// Get total count for pagination (without limit/offset)
		const totalCountQuery = db
			.select({
				count: sql<number>`count(*)`.as("count"),
			})
			.from(bestScoresSubquery)
			.innerJoin(user, eq(bestScoresSubquery.userId, user.id))
			.where(
				publicOnly
					? and(eq(user.isProfilePublic, true), isNotNull(user.publicUsername))
					: undefined
			);

		const totalCountResult = await totalCountQuery;
		const totalCount = totalCountResult[0]?.count || 0;

		console.log(
			`🏆 [API] Found ${leaderboardData.length} leaderboard entries out of ${totalCount} total`
		);

		// Add rank to each entry and generate signed URLs for images
		const leaderboardWithRank = await Promise.all(
			leaderboardData.map(async (entry, index) => ({
				...entry,
				rank: offset + index + 1,
				// Convert jackScore from integer to number for frontend
				bestJackScore: entry.bestJackScore || 0,
				totalScans: Number(entry.totalScans) || 0,
				// Only generate signed URL for public profiles with images
				bestScanImageUrl:
					entry.isProfilePublic && entry.bestScanImageUrl
						? await getImageUrl(entry.bestScanImageUrl, true)
						: null,
			}))
		);

		console.log(`🏆 [API] Returning leaderboard data:`, {
			count: leaderboardWithRank.length,
			publicOnly,
			firstEntry: leaderboardWithRank[0]
				? {
						username: leaderboardWithRank[0].publicUsername,
						score: leaderboardWithRank[0].bestJackScore,
						isPublic: leaderboardWithRank[0].isProfilePublic,
					}
				: null,
		});

		return NextResponse.json({
			success: true,
			leaderboard: leaderboardWithRank,
			publicOnly,
			sortBy,
			pagination: {
				limit,
				offset,
				total: totalCount,
				hasMore: offset + leaderboardWithRank.length < totalCount,
			},
		});
	} catch (error) {
		console.error("🏆 [API] Error fetching leaderboard:", error);
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
