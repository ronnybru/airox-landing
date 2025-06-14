import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, session } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * API route handler for payment processor webhooks
 * This handles actual payment success/failure events from Apple/Google
 */
export async function POST(request: NextRequest) {
	try {
		// Verify webhook signature (implement based on your payment processor)
		const webhookSecret = request.headers.get("x-webhook-secret");
		const expectedSecret =
			process.env.PAYMENT_WEBHOOK_SECRET || "default-webhook-secret";

		if (webhookSecret !== expectedSecret) {
			console.error("Unauthorized webhook request: Invalid secret");
			return NextResponse.json(
				{ error: "Unauthorized: Invalid webhook secret" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const {
			eventType,
			userId,
			transactionId,
			subscriptionPlan,
			paymentStatus,
		} = body;

		console.log("Payment webhook received:", {
			eventType,
			userId,
			paymentStatus,
		});

		const now = new Date();

		if (eventType === "payment_success") {
			// Payment succeeded - convert trial to active
			const updatedUser = await db
				.update(user)
				.set({
					subscriptionStatus: "active",
					subscriptionEndDate:
						subscriptionPlan === "premium_yearly"
							? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
							: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
					iapTransactionId: transactionId,
					updatedAt: now,
				})
				.where(eq(user.id, userId))
				.returning({ id: user.id, email: user.email });

			if (updatedUser.length > 0) {
				// Invalidate user's sessions to force fresh login with updated status
				await db.delete(session).where(eq(session.userId, userId));

				console.log(
					`Payment successful for user ${updatedUser[0].email}, converted to active subscription`
				);
			}

			return NextResponse.json({
				success: true,
				message: "Payment processed successfully",
			});
		} else if (eventType === "payment_failed") {
			// Payment failed - cancel trial
			const updatedUser = await db
				.update(user)
				.set({
					subscriptionStatus: "cancelled",
					updatedAt: now,
				})
				.where(eq(user.id, userId))
				.returning({ id: user.id, email: user.email });

			if (updatedUser.length > 0) {
				// Invalidate user's sessions to force logout
				await db.delete(session).where(eq(session.userId, userId));

				console.log(
					`Payment failed for user ${updatedUser[0].email}, trial cancelled`
				);
			}

			return NextResponse.json({
				success: true,
				message: "Payment failure processed",
			});
		} else if (eventType === "subscription_cancelled") {
			// User cancelled subscription
			const updatedUser = await db
				.update(user)
				.set({
					subscriptionStatus: "cancelled",
					updatedAt: now,
				})
				.where(eq(user.id, userId))
				.returning({ id: user.id, email: user.email });

			if (updatedUser.length > 0) {
				// Invalidate user's sessions
				await db.delete(session).where(eq(session.userId, userId));

				console.log(`Subscription cancelled for user ${updatedUser[0].email}`);
			}

			return NextResponse.json({
				success: true,
				message: "Cancellation processed",
			});
		}

		return NextResponse.json(
			{ success: false, error: "Unknown event type" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error processing payment webhook:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
