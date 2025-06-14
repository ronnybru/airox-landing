import crypto from "node:crypto";
import { processWebhookEvent } from "@/app/actions/membership";

/**
 * TODO: Implement proper email notification system for subscription events
 *
 * We need to implement an email notification system to handle the following events:
 * 1. New subscription created (subscription_created) - Welcome email with account details
 * 2. Subscription cancelled (subscription_cancelled) - Confirmation email with end date
 * 3. Payment failed on recurring subscription (subscription_payment_failed) - Alert user to update payment method
 * 4. Payment recovered after failure (subscription_payment_recovered) - Confirmation that subscription is active again
 * 5. Subscription updated (subscription_updated) - Confirmation of changes to subscription
 *
 * Currently, we handle the database updates for these events, but we don't send any email notifications.
 * This should be implemented once the email system is set up in the application.
 *
 * Relevant webhook events to listen for:
 * - subscription_created
 * - subscription_updated
 * - subscription_cancelled
 * - subscription_payment_failed
 * - subscription_payment_recovered
 * - subscription_payment_success (for renewal confirmations)
 */

export async function POST(request: Request) {
	if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
		return new Response("Lemon Squeezy Webhook Secret not set in .env", {
			status: 500,
		});
	}

	// First, make sure the request is from Lemon Squeezy.
	const rawBody = await request.text();
	const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

	const hmac = crypto.createHmac("sha256", secret);
	const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
	const signature = Buffer.from(
		request.headers.get("X-Signature") || "",
		"utf8"
	);

	if (!crypto.timingSafeEqual(digest, signature)) {
		return new Response("Invalid signature", {
			status: 401,
		});
	}

	const data = JSON.parse(rawBody);

	// Check if the webhook event has the required properties
	if (!data.meta || !data.data) {
		return new Response("Invalid webhook data", {
			status: 400,
		});
	}

	try {
		// Process the webhook event asynchronously
		await processWebhookEvent(data);
		return new Response("OK", { status: 200 });
	} catch (error) {
		console.error("Error processing webhook:", error);
		return new Response(`Error processing webhook: ${error}`, {
			status: 500,
		});
	}
}
