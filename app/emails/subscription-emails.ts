import { renderTemplate } from "./render-template";
import { sendEmail } from "./index";

/**
 * Send a welcome email to a new subscriber
 *
 * @param email - The recipient's email address
 * @param data - Data for the email template
 */
export async function sendSubscriptionCreatedEmail(
	email: string,
	data: {
		name: string;
		planName: string;
		startDate: string;
		nextBillingDate?: string;
		amount?: string;
		currency?: string;
	}
) {
	const html = await renderTemplate("subscription-created", data);

	return sendEmail({
		to: email,
		subject: `Welcome to Your ${data.planName} Subscription!`,
		html,
	});
}

/**
 * Send a confirmation email when a subscription is cancelled
 *
 * @param email - The recipient's email address
 * @param data - Data for the email template
 */
export async function sendSubscriptionCancelledEmail(
	email: string,
	data: {
		name: string;
		planName: string;
		endDate: string;
	}
) {
	const html = await renderTemplate("subscription-cancelled", data);

	return sendEmail({
		to: email,
		subject: `Your ${data.planName} Subscription Has Been Cancelled`,
		html,
	});
}

/**
 * Send an alert email when a payment fails
 *
 * @param email - The recipient's email address
 * @param data - Data for the email template
 */
export async function sendSubscriptionPaymentFailedEmail(
	email: string,
	data: {
		name: string;
		planName: string;
		retryDate?: string;
		updatePaymentUrl?: string;
	}
) {
	const html = await renderTemplate("subscription-payment-failed", data);

	return sendEmail({
		to: email,
		subject: `Action Required: Payment Failed for Your ${data.planName} Subscription`,
		html,
	});
}

/**
 * Send a confirmation email when a payment is recovered
 *
 * @param email - The recipient's email address
 * @param data - Data for the email template
 */
export async function sendSubscriptionPaymentRecoveredEmail(
	email: string,
	data: {
		name: string;
		planName: string;
		nextBillingDate?: string;
	}
) {
	const html = await renderTemplate("subscription-payment-recovered", data);

	return sendEmail({
		to: email,
		subject: `Good News! Your ${data.planName} Subscription Payment Has Been Processed`,
		html,
	});
}

/**
 * Send a confirmation email for successful subscription renewal
 *
 * @param email - The recipient's email address
 * @param data - Data for the email template
 */
export async function sendSubscriptionPaymentSuccessEmail(
	email: string,
	data: {
		name: string;
		planName: string;
		amount: string;
		currency: string;
		nextBillingDate?: string;
		invoiceUrl?: string;
	}
) {
	const html = await renderTemplate("subscription-payment-success", data);

	return sendEmail({
		to: email,
		subject: `Receipt for Your ${data.planName} Subscription Payment`,
		html,
	});
}
