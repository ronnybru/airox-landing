import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/app/emails";
import { z } from "zod";

// Form validation schema
const contactFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Please enter a valid email address"),
	subject: z.string().min(5, "Subject must be at least 5 characters"),
	message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate the form data
		const validatedData = contactFormSchema.parse(body);

		// Create email content
		const emailHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Contact Form Submission</title>
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.6;
						color: #333;
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
					}
					.header {
						background-color: #f8f9fa;
						padding: 20px;
						border-radius: 8px;
						margin-bottom: 20px;
					}
					.content {
						background-color: #ffffff;
						padding: 20px;
						border: 1px solid #e9ecef;
						border-radius: 8px;
					}
					.field {
						margin-bottom: 15px;
					}
					.label {
						font-weight: 600;
						color: #495057;
						display: block;
						margin-bottom: 5px;
					}
					.value {
						background-color: #f8f9fa;
						padding: 10px;
						border-radius: 4px;
						border-left: 4px solid #007bff;
					}
					.message-content {
						white-space: pre-wrap;
						word-wrap: break-word;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h1>New Contact Form Submission</h1>
					<p>You have received a new message through the airox contact form.</p>
				</div>
				
				<div class="content">
					<div class="field">
						<span class="label">Name:</span>
						<div class="value">${validatedData.name}</div>
					</div>
					
					<div class="field">
						<span class="label">Email:</span>
						<div class="value">${validatedData.email}</div>
					</div>
					
					<div class="field">
						<span class="label">Subject:</span>
						<div class="value">${validatedData.subject}</div>
					</div>
					
					<div class="field">
						<span class="label">Message:</span>
						<div class="value message-content">${validatedData.message}</div>
					</div>
				</div>
				
				<p style="margin-top: 20px; color: #6c757d; font-size: 14px;">
					This email was sent from the airox contact form. Please reply directly to ${validatedData.email} to respond to the sender.
				</p>
			</body>
			</html>
		`;

		// Create plain text version
		const emailText = `
New Contact Form Submission

Name: ${validatedData.name}
Email: ${validatedData.email}
Subject: ${validatedData.subject}

Message:
${validatedData.message}

---
This email was sent from the airox contact form. Please reply directly to ${validatedData.email} to respond to the sender.
		`.trim();

		// Send email to the company
		await sendEmail({
			to: process.env.EMAIL_FROM || "hello@airox.ai",
			subject: `Contact Form: ${validatedData.subject}`,
			html: emailHtml,
			text: emailText,
		});

		// Send confirmation email to the user
		const confirmationHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Thank you for contacting us</title>
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.6;
						color: #333;
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
					}
					.header {
						background-color: #007bff;
						color: white;
						padding: 20px;
						border-radius: 8px;
						text-align: center;
						margin-bottom: 20px;
					}
					.content {
						background-color: #ffffff;
						padding: 20px;
						border: 1px solid #e9ecef;
						border-radius: 8px;
					}
					.footer {
						margin-top: 20px;
						padding-top: 20px;
						border-top: 1px solid #e9ecef;
						color: #6c757d;
						font-size: 14px;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h1>Thank you for contacting airox!</h1>
				</div>
				
				<div class="content">
					<p>Hi ${validatedData.name},</p>
					
					<p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
					
					<p><strong>Your message:</strong></p>
					<p style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #007bff;">
						<strong>Subject:</strong> ${validatedData.subject}<br><br>
						<span style="white-space: pre-wrap;">${validatedData.message}</span>
					</p>
					
					<p>We typically respond within 24 hours during business days. If your inquiry is urgent, please don't hesitate to reach out to us directly at hello@airox.ai.</p>
					
					<p>Best regards,<br>The airox Team</p>
				</div>
				
				<div class="footer">
					<p>This is an automated confirmation email. Please do not reply to this email.</p>
				</div>
			</body>
			</html>
		`;

		const confirmationText = `
Thank you for contacting airox!

Hi ${validatedData.name},

Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.

Your message:
Subject: ${validatedData.subject}

${validatedData.message}

We typically respond within 24 hours during business days. If your inquiry is urgent, please don't hesitate to reach out to us directly at hello@airox.ai.

Best regards,
The airox Team

---
This is an automated confirmation email. Please do not reply to this email.
		`.trim();

		// Send confirmation email to the user
		await sendEmail({
			to: validatedData.email,
			subject: "Thank you for contacting airox",
			html: confirmationHtml,
			text: confirmationText,
		});

		return NextResponse.json(
			{ success: true, message: "Message sent successfully" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Contact form error:", error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ success: false, message: "Invalid form data", errors: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				success: false,
				message: "Failed to send message. Please try again later.",
			},
			{ status: 500 }
		);
	}
}
