import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { renderTemplate } from "./render-template";
import { sendEmail } from "./index";
import { getCurrentUserId } from "@/lib/session";

// Initialize Redis connection
const redisConnection = new IORedis({
	host: process.env.REDIS_HOST || "localhost",
	port: parseInt(process.env.REDIS_PORT || "6379"),
	maxRetriesPerRequest: null,
});

// Create a queue for welcome emails
const welcomeEmailQueue = new Queue("welcome-emails", {
	connection: redisConnection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	},
});

// Note: If you need a scheduler for delayed jobs, you'll need to set it up
// For BullMQ 4.x+, you would typically use:
// import { QueueScheduler } from "bullmq";
// const welcomeEmailScheduler = new QueueScheduler("welcome-emails", {
//   connection: redisConnection,
// });
//
// However, for most recent versions, the Queue itself handles scheduling

// Define email types
type WelcomeEmailType = "day1" | "day3" | "day7";

// Define email variants
type EmailVariant = "a" | "b";

// Define email data interface
interface WelcomeEmailData {
	userId: string;
	email: string;
	name: string;
	emailType: WelcomeEmailType;
	variant: EmailVariant;
	dashboardUrl?: string;
	featuresUrl?: string;
	tutorialUrl?: string;
	templatesUrl?: string;
	advancedGuideUrl?: string;
	unsubscribeUrl?: string;
}

/**
 * Process welcome emails
 */
const welcomeEmailWorker = new Worker(
	"welcome-emails",
	async (job) => {
		const data = job.data as WelcomeEmailData;

		try {
			// Get template name based on email type and variant
			const templateName = `welcome-${data.emailType}${
				data.variant === "b" ? "-b" : ""
			}`;

			// Prepare email data
			const emailData = {
				name: data.name,
				dashboardUrl:
					data.dashboardUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
				featuresUrl:
					data.featuresUrl || `${process.env.NEXT_PUBLIC_APP_URL}/features`,
				tutorialUrl:
					data.tutorialUrl || `${process.env.NEXT_PUBLIC_APP_URL}/tutorial`,
				templatesUrl:
					data.templatesUrl || `${process.env.NEXT_PUBLIC_APP_URL}/templates`,
				advancedGuideUrl:
					data.advancedGuideUrl ||
					`${process.env.NEXT_PUBLIC_APP_URL}/advanced-guide`,
				unsubscribeUrl:
					data.unsubscribeUrl ||
					`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?userId=${data.userId}`,
			};

			// Render the email template
			const html = await renderTemplate(templateName, emailData);

			// Define subject based on email type
			let subject = "";
			switch (data.emailType) {
				case "day1":
					subject = "Welcome to airox!";
					break;
				case "day3":
					subject = "Discover Key Features - airox";
					break;
				case "day7":
					subject = "Advanced Tips & Best Practices - airox";
					break;
			}

			// Send the email
			await sendEmail({
				to: data.email,
				subject,
				html,
			});

			console.log(`Welcome email ${data.emailType} sent to ${data.email}`);
			return { success: true };
		} catch (error) {
			console.error(
				`Error sending welcome email ${data.emailType} to ${data.email}:`,
				error
			);
			throw error;
		}
	},
	{ connection: redisConnection }
);

/**
 * Schedule welcome emails for a user
 *
 * @param userId - The user's ID
 * @param email - The user's email address
 * @param name - The user's name
 * @param variant - The email variant to use (a or b)
 * @param options - Additional options for the welcome emails
 */
export async function scheduleWelcomeEmails(
	userId: string,
	email: string,
	name: string,
	variant: EmailVariant = "a",
	options?: {
		dashboardUrl?: string;
		featuresUrl?: string;
		tutorialUrl?: string;
		templatesUrl?: string;
		advancedGuideUrl?: string;
		unsubscribeUrl?: string;
	}
) {
	try {
		// Log which variant is being used for analytics
		console.log(`Using email variant ${variant} for user ${userId}`);

		// Schedule day 1 email (immediate)
		await welcomeEmailQueue.add(
			`welcome-day1-${variant}`,
			{
				userId,
				email,
				name,
				emailType: "day1",
				variant,
				...options,
			} as WelcomeEmailData,
			{
				delay: 0, // Send immediately
			}
		);

		// Schedule day 3 email
		await welcomeEmailQueue.add(
			`welcome-day3-${variant}`,
			{
				userId,
				email,
				name,
				emailType: "day3",
				variant,
				...options,
			} as WelcomeEmailData,
			{
				delay: 1000 * 60 * 60 * 24 * 3, // 3 days in milliseconds
			}
		);

		// Schedule day 7 email
		await welcomeEmailQueue.add(
			`welcome-day7-${variant}`,
			{
				userId,
				email,
				name,
				emailType: "day7",
				variant,
				...options,
			} as WelcomeEmailData,
			{
				delay: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
			}
		);

		console.log(`Welcome email series scheduled for ${email}`);
		return { success: true };
	} catch (error) {
		console.error("Error scheduling welcome emails:", error);
		throw error;
	}
}

/**
 * Send a specific welcome email immediately
 *
 * @param userId - The user's ID
 * @param email - The user's email address
 * @param name - The user's name
 * @param emailType - The type of welcome email to send
 * @param variant - The email variant to use (a or b)
 * @param options - Additional options for the welcome email
 */
export async function sendWelcomeEmail(
	userId: string,
	email: string,
	name: string,
	emailType: WelcomeEmailType,
	variant: EmailVariant = "a",
	options?: {
		dashboardUrl?: string;
		featuresUrl?: string;
		tutorialUrl?: string;
		templatesUrl?: string;
		advancedGuideUrl?: string;
		unsubscribeUrl?: string;
	}
) {
	try {
		// Log which variant is being used for analytics
		console.log(
			`Using email variant ${variant} for user ${userId} (${emailType})`
		);

		// Add the job to the queue with no delay
		await welcomeEmailQueue.add(
			`welcome-${emailType}-${variant}`,
			{
				userId,
				email,
				name,
				emailType,
				variant,
				...options,
			} as WelcomeEmailData,
			{
				delay: 0, // Send immediately
			}
		);

		console.log(`Welcome email ${emailType} queued for ${email}`);
		return { success: true };
	} catch (error) {
		console.error(`Error sending welcome email ${emailType}:`, error);
		throw error;
	}
}

/**
 * Server action to schedule welcome emails for the current user
 */
export async function scheduleWelcomeEmailsForCurrentUser() {
	try {
		const userId = await getCurrentUserId();
		if (!userId) {
			throw new Error("User not authenticated");
		}

		// Fetch user data from the database
		// This is a placeholder - replace with your actual database query
		const user = await fetchUserData(userId);

		if (!user) {
			throw new Error("User not found");
		}

		// Schedule welcome emails
		return scheduleWelcomeEmails(userId, user.email, user.name);
	} catch (error) {
		console.error("Error scheduling welcome emails for current user:", error);
		throw error;
	}
}

/**
 * Placeholder function to fetch user data
 * Replace this with your actual database query
 */
async function fetchUserData(userId: string) {
	// This is a placeholder - replace with your actual database query
	// For example, using Drizzle ORM:
	// import { db } from "@/lib/db";
	// import { user } from "@/lib/db/schema";
	// import { eq } from "drizzle-orm";
	// return db.query.user.findFirst({ where: eq(user.id, userId) });

	// Placeholder implementation
	return {
		id: userId,
		email: "user@example.com",
		name: "User Name",
	};
}

/**
 * Gracefully shut down the worker when the application is terminated
 */
process.on("SIGTERM", async () => {
	await welcomeEmailWorker.close();
});

export { welcomeEmailQueue, welcomeEmailWorker };
