import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supportFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Valid email is required"),
	issueType: z.enum([
		"bug-report",
		"feature-request",
		"account-issue",
		"scanning-help",
		"billing",
		"other",
	]),
	message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();

		const data = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			issueType: formData.get("issueType") as string,
			message: formData.get("message") as string,
		};

		// Validate the form data
		const validatedData = supportFormSchema.parse(data);

		// Here you would typically:
		// 1. Send an email to your support team
		// 2. Save to database
		// 3. Send confirmation email to user

		// For now, we'll just log it (replace with your email service)
		console.log("Support request received:", {
			...validatedData,
			timestamp: new Date().toISOString(),
		});

		// You can integrate with services like:
		// - Resend for email
		// - SendGrid
		// - Nodemailer
		// - Save to your database

		// Return success response
		return NextResponse.redirect(new URL("/support/thank-you", request.url), {
			status: 302,
		});
	} catch (error) {
		console.error("Support form error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid form data", details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to submit support request" },
			{ status: 500 }
		);
	}
}
