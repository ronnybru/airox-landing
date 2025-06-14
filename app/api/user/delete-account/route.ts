import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
	user,
	session,
	account,
	bodyScans,
	bodyScanComparisons,
	publicLeaderboard,
	notifications,
	member,
	invitation,
	pushTokens,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE() {
	try {
		// Get the session from the request
		const userSession = await auth.api.getSession({
			headers: await headers(),
		});

		if (!userSession) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = userSession.user.id;

		console.log(`Starting account deletion for user: ${userId}`);

		// Step 1: Get all body scan images to delete from S3
		const userBodyScans = await db
			.select({ imageUrl: bodyScans.imageUrl })
			.from(bodyScans)
			.where(eq(bodyScans.userId, userId));

		console.log(`Found ${userBodyScans.length} body scan images to delete`);

		// Step 2: Delete all S3 images
		const s3DeletionPromises = userBodyScans.map(async (scan) => {
			try {
				await deleteFromS3(scan.imageUrl);
				console.log(`Deleted S3 image: ${scan.imageUrl}`);
			} catch (error) {
				console.error(`Failed to delete S3 image ${scan.imageUrl}:`, error);
				// Continue with other deletions even if one fails
			}
		});

		// Wait for all S3 deletions to complete (or fail)
		await Promise.allSettled(s3DeletionPromises);

		// Step 3: Delete profile image if exists
		const userData = await db.query.user.findFirst({
			where: eq(user.id, userId),
			columns: { profileImageUrl: true },
		});

		if (userData?.profileImageUrl) {
			try {
				// Extract S3 key from profile image URL if it's stored as a full URL
				let profileImageKey = userData.profileImageUrl;
				if (profileImageKey.includes("amazonaws.com/")) {
					profileImageKey = profileImageKey.split("amazonaws.com/")[1];
				} else if (profileImageKey.includes("cloudfront.net/")) {
					profileImageKey = profileImageKey.split("cloudfront.net/")[1];
				}

				await deleteFromS3(profileImageKey);
				console.log(`Deleted profile image: ${profileImageKey}`);
			} catch (error) {
				console.error(`Failed to delete profile image:`, error);
			}
		}

		// Step 4: Delete database records in correct order (respecting foreign key constraints)

		// Delete body scan comparisons first
		await db
			.delete(bodyScanComparisons)
			.where(eq(bodyScanComparisons.userId, userId));
		console.log("Deleted body scan comparisons");

		// Delete public leaderboard entries
		await db
			.delete(publicLeaderboard)
			.where(eq(publicLeaderboard.userId, userId));
		console.log("Deleted leaderboard entries");

		// Delete body scans
		await db.delete(bodyScans).where(eq(bodyScans.userId, userId));
		console.log("Deleted body scans");

		// Delete notifications
		await db.delete(notifications).where(eq(notifications.userId, userId));
		console.log("Deleted notifications");

		// Delete organization memberships
		await db.delete(member).where(eq(member.userId, userId));
		console.log("Deleted organization memberships");

		// Delete invitations sent by this user
		await db.delete(invitation).where(eq(invitation.inviterId, userId));
		console.log("Deleted invitations");

		// Delete push tokens (they will be cascade deleted anyway, but explicit is better)
		await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

		// Delete user sessions
		await db.delete(session).where(eq(session.userId, userId));
		console.log("Deleted user sessions");

		// Delete user accounts (OAuth connections)
		await db.delete(account).where(eq(account.userId, userId));
		console.log("Deleted user accounts");

		// Step 5: Finally delete the user record
		await db.delete(user).where(eq(user.id, userId));
		console.log("Deleted user record");

		console.log(`Account deletion completed for user: ${userId}`);

		return NextResponse.json({
			success: true,
			message: "Account and all associated data have been permanently deleted",
		});
	} catch (error) {
		console.error("Error deleting user account:", error);
		return NextResponse.json(
			{
				error: "Failed to delete account. Please try again or contact support.",
			},
			{ status: 500 }
		);
	}
}
