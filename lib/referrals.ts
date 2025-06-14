import { db } from "@/lib/db";
import { user, referralCodes, referralUsage } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Generate a unique referral code for a user
 */
export async function generateReferralCode(userId: string): Promise<string> {
	// Generate a random 8-character code
	let code: string;
	let isUnique = false;
	let attempts = 0;
	const maxAttempts = 10;

	while (!isUnique && attempts < maxAttempts) {
		code = Math.random().toString(36).substring(2, 10).toUpperCase();

		// Check if code already exists
		const existing = await db
			.select()
			.from(referralCodes)
			.where(eq(referralCodes.code, code))
			.limit(1);

		if (existing.length === 0) {
			isUnique = true;
		}
		attempts++;
	}

	if (!isUnique) {
		throw new Error("Failed to generate unique referral code");
	}

	// Create the referral code record
	const referralCodeId = nanoid();
	await db.insert(referralCodes).values({
		id: referralCodeId,
		userId,
		code: code!,
		isActive: true,
		usageCount: 0,
		creditAmount: 2000, // $20.00 in cents
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	// Update user's referral code
	await db
		.update(user)
		.set({
			referralCode: code!,
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId));

	return code!;
}

/**
 * Get or create a referral code for a user
 */
export async function getUserReferralCode(userId: string): Promise<string> {
	// Check if user already has a referral code
	const userData = await db
		.select({ referralCode: user.referralCode })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (userData.length === 0) {
		throw new Error("User not found");
	}

	if (userData[0].referralCode) {
		return userData[0].referralCode;
	}

	// Generate new referral code
	return await generateReferralCode(userId);
}

/**
 * Apply a referral code when a user signs up
 */
export async function applyReferralCode(
	newUserId: string,
	referralCode: string
): Promise<{ success: boolean; error?: string; creditAwarded?: number }> {
	try {
		// Find the referral code
		const referralCodeData = await db
			.select({
				id: referralCodes.id,
				userId: referralCodes.userId,
				isActive: referralCodes.isActive,
				usageCount: referralCodes.usageCount,
				maxUsage: referralCodes.maxUsage,
				creditAmount: referralCodes.creditAmount,
			})
			.from(referralCodes)
			.where(eq(referralCodes.code, referralCode.toUpperCase()))
			.limit(1);

		if (referralCodeData.length === 0) {
			return { success: false, error: "Invalid referral code" };
		}

		const codeData = referralCodeData[0];

		// Check if referral code is active
		if (!codeData.isActive) {
			return { success: false, error: "Referral code is no longer active" };
		}

		// Check if usage limit is reached
		if (codeData.maxUsage && codeData.usageCount >= codeData.maxUsage) {
			return { success: false, error: "Referral code usage limit reached" };
		}

		// Check if user is trying to use their own referral code
		if (codeData.userId === newUserId) {
			return { success: false, error: "Cannot use your own referral code" };
		}

		// Check if user has already been referred
		const existingReferral = await db
			.select()
			.from(user)
			.where(and(eq(user.id, newUserId), eq(user.referredBy, codeData.userId)))
			.limit(1);

		if (existingReferral.length > 0) {
			return { success: false, error: "User has already been referred" };
		}

		// Apply the referral
		const usageId = nanoid();

		// Create referral usage record
		await db.insert(referralUsage).values({
			id: usageId,
			referralCodeId: codeData.id,
			referrerId: codeData.userId,
			referredUserId: newUserId,
			creditAwarded: codeData.creditAmount,
			status: "completed",
			createdAt: new Date(),
			processedAt: new Date(),
		});

		// Update referral code usage count
		await db
			.update(referralCodes)
			.set({
				usageCount: codeData.usageCount + 1,
				updatedAt: new Date(),
			})
			.where(eq(referralCodes.id, codeData.id));

		// Update referred user
		await db
			.update(user)
			.set({
				referredBy: codeData.userId,
				updatedAt: new Date(),
			})
			.where(eq(user.id, newUserId));

		// Award credits to referrer
		const referrerData = await db
			.select({ credits: user.credits })
			.from(user)
			.where(eq(user.id, codeData.userId))
			.limit(1);

		const currentCredits = referrerData[0]?.credits || 0;

		await db
			.update(user)
			.set({
				credits: currentCredits + codeData.creditAmount,
				updatedAt: new Date(),
			})
			.where(eq(user.id, codeData.userId));

		return {
			success: true,
			creditAwarded: codeData.creditAmount,
		};
	} catch (error) {
		console.error("Error applying referral code:", error);
		return { success: false, error: "Failed to apply referral code" };
	}
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string) {
	try {
		// Get user's referral code
		const userCode = await getUserReferralCode(userId);

		// Get referral usage statistics
		const stats = await db
			.select({
				totalReferrals: referralUsage.referrerId,
				totalCreditsEarned: referralUsage.creditAwarded,
			})
			.from(referralUsage)
			.where(eq(referralUsage.referrerId, userId));

		const totalReferrals = stats.length;
		const totalCreditsEarned = stats.reduce(
			(sum, stat) => sum + stat.totalCreditsEarned,
			0
		);

		// Get user's current credits
		const userData = await db
			.select({ credits: user.credits })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		const currentCredits = userData[0]?.credits || 0;

		return {
			referralCode: userCode,
			totalReferrals,
			totalCreditsEarned,
			currentCredits,
		};
	} catch (error) {
		console.error("Error getting referral stats:", error);
		throw error;
	}
}
