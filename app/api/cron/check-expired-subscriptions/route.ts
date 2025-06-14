import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, session } from "@/lib/db/schema";
import { and, eq, lt, inArray } from "drizzle-orm";

/**
 * API route handler for the check-expired-subscriptions cron job
 * This job handles unpaid trial cancellation and expired subscription cleanup
 * Note: Trial-to-active conversion is handled by payment webhooks
 */
export async function POST(request: NextRequest) {
	try {
		// Verify the cron secret to ensure this is called by our cron service
		const cronSecret = request.headers.get("x-cron-secret");
		const expectedSecret = process.env.CRON_SECRET || "default-cron-secret";

		if (cronSecret !== expectedSecret) {
			console.error("Unauthorized cron job request: Invalid secret");
			return NextResponse.json(
				{ error: "Unauthorized: Invalid cron secret" },
				{ status: 401 }
			);
		}

		const now = new Date();
		let totalUpdated = 0;
		let totalSessionsInvalidated = 0;

		// 1. Check for unpaid trials that should be cancelled (7 days after subscription start date)
		// This gives 4 extra days buffer after the 3-day trial for payment processing
		// With server-to-server notifications, this should be more than enough time
		// Payment webhooks should have converted successful payments by now
		const unpaidTrials = await db
			.select({
				id: user.id,
				email: user.email,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionStartDate: user.subscriptionStartDate,
			})
			.from(user)
			.where(
				and(
					eq(user.subscriptionStatus, "trial"),
					lt(
						user.subscriptionStartDate,
						new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago (3 day trial + 4 day buffer)
					)
				)
			);

		if (unpaidTrials.length > 0) {
			// Cancel unpaid trials (payment webhook should have converted successful payments by now)
			const cancelledTrials = await db
				.update(user)
				.set({
					subscriptionStatus: "cancelled",
					updatedAt: now,
				})
				.where(
					and(
						eq(user.subscriptionStatus, "trial"),
						lt(
							user.subscriptionStartDate,
							new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
						)
					)
				)
				.returning({ id: user.id, email: user.email });

			// Invalidate sessions for cancelled trial users
			if (cancelledTrials.length > 0) {
				const userIds = cancelledTrials.map((u) => u.id);
				const deletedSessions = await db
					.delete(session)
					.where(inArray(session.userId, userIds))
					.returning({ id: session.id });

				totalSessionsInvalidated += deletedSessions.length;
			}

			totalUpdated += cancelledTrials.length;
			console.log(
				`Cancelled ${cancelledTrials.length} unpaid trial users:`,
				cancelledTrials.map((u) => u.email)
			);
		}

		// 2. Check for expired paid subscriptions
		const expiredSubscriptionUsers = await db
			.select({
				id: user.id,
				email: user.email,
				subscriptionStatus: user.subscriptionStatus,
				subscriptionEndDate: user.subscriptionEndDate,
			})
			.from(user)
			.where(
				and(
					eq(user.subscriptionStatus, "active"),
					lt(user.subscriptionEndDate, now)
				)
			);

		if (expiredSubscriptionUsers.length > 0) {
			// Update expired subscription users to expired status
			const expiredSubscriptionResult = await db
				.update(user)
				.set({
					subscriptionStatus: "expired",
					updatedAt: now,
				})
				.where(
					and(
						eq(user.subscriptionStatus, "active"),
						lt(user.subscriptionEndDate, now)
					)
				)
				.returning({ id: user.id, email: user.email });

			// Invalidate sessions for expired subscription users
			if (expiredSubscriptionResult.length > 0) {
				const userIds = expiredSubscriptionResult.map((u) => u.id);
				const deletedSessions = await db
					.delete(session)
					.where(inArray(session.userId, userIds))
					.returning({ id: session.id });

				totalSessionsInvalidated += deletedSessions.length;
			}

			totalUpdated += expiredSubscriptionResult.length;
			console.log(
				`Updated ${expiredSubscriptionResult.length} expired subscription users to expired:`,
				expiredSubscriptionResult.map((u) => u.email)
			);
		}

		return NextResponse.json({
			success: true,
			message: `Updated ${totalUpdated} users and invalidated ${totalSessionsInvalidated} sessions`,
			details: {
				cancelledTrials: unpaidTrials.length,
				expiredSubscriptions: expiredSubscriptionUsers.length,
				sessionsInvalidated: totalSessionsInvalidated,
			},
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in check-expired-subscriptions cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
