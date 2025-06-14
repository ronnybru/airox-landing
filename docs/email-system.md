# Email System Documentation

This document explains how to set up and use the email system in the boilerplate. The email system uses [Resend](https://resend.com) for sending emails and provides a template-based approach for creating and sending emails.

## Setup

### 1. Install Resend

The Resend package is already installed in the project. If you need to install it manually, run:

```bash
npm install resend
```

### 2. Set up Resend API Key

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Create an API key in the Resend dashboard
3. Add the API key to your environment variables:

```
# .env
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@yourdomain.com
```

Note: For the `EMAIL_FROM` address, you need to verify your domain in the Resend dashboard or use a domain provided by Resend.

## Email System Structure

The email system is organized as follows:

```
app/
  emails/
    index.ts                  # Main email utility functions
    render-template.ts        # Template rendering utility
    subscription-emails.ts    # Subscription-related email functions
    templates/                # Email templates in HTML format
      subscription-created.html
      subscription-cancelled.html
      subscription-payment-failed.html
      subscription-payment-recovered.html
      subscription-payment-success.html
      # Add more templates as needed
```

## How to Use

### Sending a Basic Email

To send a basic email, use the `sendEmail` function from `app/emails/index.ts`:

```typescript
import { sendEmail } from "@/app/emails";

await sendEmail({
	to: "user@example.com",
	subject: "Hello World",
	html: "<h1>Hello World</h1><p>This is a test email.</p>",
	text: "Hello World. This is a test email.", // Optional plain text version
});
```

### Using Email Templates

To send an email using a template:

1. Create an HTML template in the `app/emails/templates` directory
2. Use the `renderTemplate` function to render the template with data
3. Send the email using the `sendEmail` function

Example:

```typescript
import { renderTemplate } from "@/app/emails/render-template";
import { sendEmail } from "@/app/emails";

// Render the template with data
const html = await renderTemplate("welcome", {
	name: "John Doe",
	activationLink: "https://example.com/activate?token=123456",
});

// Send the email
await sendEmail({
	to: "user@example.com",
	subject: "Welcome to Our Platform",
	html,
});
```

### Creating Email Templates

Email templates are HTML files with variable placeholders. Variables are enclosed in double curly braces: `{{variableName}}`.

Example template (`app/emails/templates/welcome.html`):

```html
<!doctype html>
<html>
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Welcome to Our Platform</title>
		<style>
			/* Your styles here */
		</style>
	</head>
	<body>
		<div class="container">
			<h1>Welcome, {{name}}!</h1>
			<p>
				Thank you for signing up. Please click the link below to activate your
				account:
			</p>
			<a href="{{activationLink}}">Activate Account</a>
		</div>
	</body>
</html>
```

### Conditional Content in Templates

The template renderer supports basic conditionals using the `{{#variable}}...{{/variable}}` syntax. If the variable is truthy, the content between the tags will be included; otherwise, it will be removed.

Example:

```html
<div>
	<p>Hello {{name}},</p>

	{{#isPremium}}
	<p>Thank you for being a premium member!</p>
	{{/isPremium}}

	<p>Best regards,<br />The Team</p>
</div>
```

### Subscription Emails

The boilerplate includes pre-built functions for sending subscription-related emails. These functions are defined in `app/emails/subscription-emails.ts` and are used in the webhook handlers in `app/actions/membership.ts`.

Available subscription email functions:

- `sendSubscriptionCreatedEmail`: Welcome email for new subscribers
- `sendSubscriptionCancelledEmail`: Confirmation email when a subscription is cancelled
- `sendSubscriptionPaymentFailedEmail`: Alert email when a payment fails
- `sendSubscriptionPaymentRecoveredEmail`: Confirmation email when a payment is recovered
- `sendSubscriptionPaymentSuccessEmail`: Receipt email for successful payments

Example usage:

```typescript
import { sendSubscriptionCreatedEmail } from "@/app/emails/subscription-emails";

await sendSubscriptionCreatedEmail("user@example.com", {
	name: "John Doe",
	planName: "Premium",
	startDate: "April 29, 2025",
	nextBillingDate: "May 29, 2025",
	amount: "12.99",
	currency: "$",
});
```

## Adding New Email Templates

To add a new email template:

1. Create a new HTML file in the `app/emails/templates` directory
2. Create a function in an appropriate file (or create a new file) to send the email
3. Use the `renderTemplate` and `sendEmail` functions to send the email

Example:

```typescript
// app/emails/user-emails.ts
import { renderTemplate } from "./render-template";
import { sendEmail } from "./index";

export async function sendPasswordResetEmail(
	email: string,
	data: {
		name: string;
		resetLink: string;
		expirationTime: string;
	}
) {
	const html = await renderTemplate("password-reset", data);

	return sendEmail({
		to: email,
		subject: "Reset Your Password",
		html,
	});
}
```

## Testing Emails

For testing emails during development, you can use Resend's test mode or a local email testing tool like [Mailpit](https://github.com/axllent/mailpit).

To use Resend's test mode, set the `RESEND_API_KEY` to a test API key from the Resend dashboard.

## Troubleshooting

- **Emails not sending**: Check that your `RESEND_API_KEY` is correct and that you're using a verified domain for the `EMAIL_FROM` address.
- **Template rendering errors**: Make sure the template file exists and that you're passing all the required variables.
- **Conditional content not working**: Ensure that the variable names in the conditionals match the variable names in the data object.

## Best Practices

- Keep email templates simple and responsive
- Use inline CSS for styling (many email clients don't support external stylesheets)
- Always provide a plain text alternative for accessibility
- Test emails across different email clients
- Use a consistent design language across all emails
- Keep subject lines clear and concise
