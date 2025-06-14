import { Resend } from "resend";

// Lazy initialization of Resend
let resend: Resend | null = null;

function getResendClient() {
	if (!resend) {
		if (!process.env.RESEND_API_KEY) {
			throw new Error("RESEND_API_KEY is not defined in environment variables");
		}
		resend = new Resend(process.env.RESEND_API_KEY);
	}
	return resend;
}

/**
 * Send an email using Resend
 *
 * @param from - The sender's email address (must be a verified domain in Resend)
 * @param to - The recipient's email address
 * @param subject - The email subject
 * @param html - The HTML content of the email
 * @param text - The plain text content of the email (optional)
 * @returns The result of the email sending operation
 */
export async function sendEmail({
	from = process.env.EMAIL_FROM || "noreply@yourdomain.com",
	to,
	subject,
	html,
	text,
}: {
	from?: string;
	to: string;
	subject: string;
	html: string;
	text?: string;
}) {
	try {
		const resendClient = getResendClient();
		const { data, error } = await resendClient.emails.send({
			from,
			to,
			subject,
			html,
			text,
		});

		if (error) {
			console.error("Error sending email:", error);
			throw new Error(`Failed to send email: ${error.message}`);
		}

		return { success: true, data };
	} catch (error) {
		console.error("Error sending email:", error);
		throw error;
	}
}
