"use server";

import { db } from "@/lib/db";
import { user, organizationMemberships, member } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

// Define the statistics interface
interface EmailTestStats {
	// User counts
	totalUsers: number;
	variantAUsers: number;
	variantBUsers: number;

	// Conversion counts
	totalConversions: number;
	variantAConversions: number;
	variantBConversions: number;

	// Time to conversion
	variantAAvgDaysToConversion: number;
	variantBAvgDaysToConversion: number;

	// Conversion timeline
	variantAEarlyConversions: number; // Day 1-3
	variantAMidConversions: number; // Day 4-6
	variantALateConversions: number; // Day 7+
	variantBEarlyConversions: number; // Day 1-3
	variantBMidConversions: number; // Day 4-6
	variantBLateConversions: number; // Day 7+
}

/**
 * Fetch statistics about email split testing and conversion rates
 */
export async function fetchEmailTestStats(): Promise<EmailTestStats> {
	// Get counts of users by variant
	const userCounts = await db
		.select({
			variant: user.emailVariant,
			count: sql<number>`count(*)`,
		})
		.from(user)
		.where(sql`${user.emailVariant} is not null`)
		.groupBy(user.emailVariant);

	// Get total count of users with variants directly
	const totalUsersResult = await db
		.select({
			count: sql<number>`count(*)`,
		})
		.from(user)
		.where(sql`${user.emailVariant} is not null`);

	// Map the results to variables
	const variantAUsers = userCounts.find((c) => c.variant === "a")?.count || 0;
	const variantBUsers = userCounts.find((c) => c.variant === "b")?.count || 0;
	const totalUsers = totalUsersResult[0]?.count || 0;

	// Get conversions (users who have a membership through their organization)
	const conversions = await db
		.select({
			userId: user.id,
			variant: user.emailVariant,
			startDate: organizationMemberships.startDate,
			createdAt: user.createdAt,
		})
		.from(user)
		.innerJoin(member, eq(member.userId, user.id))
		.innerJoin(
			organizationMemberships,
			eq(organizationMemberships.organizationId, member.organizationId)
		)
		.where(
			and(
				sql`${user.emailVariant} is not null`,
				eq(organizationMemberships.status, "active")
			)
		);

	// Calculate conversion metrics
	const variantAConversions = conversions.filter(
		(c) => c.variant === "a"
	).length;
	const variantBConversions = conversions.filter(
		(c) => c.variant === "b"
	).length;
	const totalConversions = variantAConversions + variantBConversions;

	// Calculate days to conversion for each variant
	const variantAConversionDays = conversions
		.filter((c) => c.variant === "a")
		.map((c) => {
			const createdDate = new Date(c.createdAt);
			const conversionDate = new Date(c.startDate);
			return Math.max(
				0,
				Math.floor(
					(conversionDate.getTime() - createdDate.getTime()) /
						(1000 * 60 * 60 * 24)
				)
			);
		});

	const variantBConversionDays = conversions
		.filter((c) => c.variant === "b")
		.map((c) => {
			const createdDate = new Date(c.createdAt);
			const conversionDate = new Date(c.startDate);
			return Math.max(
				0,
				Math.floor(
					(conversionDate.getTime() - createdDate.getTime()) /
						(1000 * 60 * 60 * 24)
				)
			);
		});

	// Calculate average days to conversion
	const variantAAvgDaysToConversion =
		variantAConversionDays.length > 0
			? variantAConversionDays.reduce((sum, days) => sum + days, 0) /
				variantAConversionDays.length
			: 0;

	const variantBAvgDaysToConversion =
		variantBConversionDays.length > 0
			? variantBConversionDays.reduce((sum, days) => sum + days, 0) /
				variantBConversionDays.length
			: 0;

	// Calculate conversion timeline
	const variantAEarlyConversions = variantAConversionDays.filter(
		(days) => days >= 0 && days <= 3
	).length;
	const variantAMidConversions = variantAConversionDays.filter(
		(days) => days >= 4 && days <= 6
	).length;
	const variantALateConversions = variantAConversionDays.filter(
		(days) => days >= 7
	).length;

	const variantBEarlyConversions = variantBConversionDays.filter(
		(days) => days >= 0 && days <= 3
	).length;
	const variantBMidConversions = variantBConversionDays.filter(
		(days) => days >= 4 && days <= 6
	).length;
	const variantBLateConversions = variantBConversionDays.filter(
		(days) => days >= 7
	).length;

	return {
		totalUsers,
		variantAUsers,
		variantBUsers,
		totalConversions,
		variantAConversions,
		variantBConversions,
		variantAAvgDaysToConversion,
		variantBAvgDaysToConversion,
		variantAEarlyConversions,
		variantAMidConversions,
		variantALateConversions,
		variantBEarlyConversions,
		variantBMidConversions,
		variantBLateConversions,
	};
}
