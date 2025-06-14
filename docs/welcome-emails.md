# Welcome Email Series Documentation

This document explains the welcome email series system implemented in the application. The system sends a series of three onboarding emails to new users over the course of a week.

## Overview

The welcome email series consists of three emails:

1. **Day 1 Email**: Sent immediately after signup, welcoming the user and providing initial guidance.
2. **Day 3 Email**: Sent 3 days after signup, highlighting key features of the platform.
3. **Day 7 Email**: Sent 7 days after signup, providing advanced tips and best practices.

## Technical Implementation

The welcome email system is built using:

- **BullMQ**: For job queuing and scheduling delayed emails
- **IORedis**: For Redis connection management
- **Resend**: For sending the actual emails (via the existing email system)

### Components

1. **Email Templates**: Located in `app/emails/templates/`

   - `welcome-day1.html`: Initial welcome email
   - `welcome-day3.html`: Features overview email
   - `welcome-day7.html`: Advanced tips email

2. **Email Queue System**: Located in `app/emails/welcome-emails.ts`

   - Sets up Redis connection
   - Creates a BullMQ queue for welcome emails
   - Defines worker for processing email jobs
   - Provides functions for scheduling and sending welcome emails

3. **Server Actions**: Located in `app/actions/welcome-emails.ts`

   - `startWelcomeEmailSeries`: Schedules all three welcome emails for a user
   - `sendSpecificWelcomeEmail`: Sends a specific welcome email (useful for testing)

4. **Authentication Integration**: In `lib/auth.ts`
   - Uses Better Auth's after hook to automatically trigger the welcome email series when a new user signs up

## How It Works

1. When a user signs up, the auth system's after hook automatically calls `startWelcomeEmailSeries` for the new user.
2. The first welcome email is sent immediately.
3. The second and third emails are scheduled to be sent 3 and 7 days later, respectively.
4. BullMQ handles the scheduling and processing of these delayed jobs.
5. When it's time to send an email, the worker processes the job, renders the appropriate template, and sends the email using Resend.

## Usage

### Automatically Triggering Welcome Emails

The welcome email series is automatically triggered when a new user signs up, thanks to the integration with the authentication system.

### Manually Triggering Welcome Emails

You can manually trigger the welcome email series for a user using the server actions:

```typescript
import { startWelcomeEmailSeries } from "@/app/actions/welcome-emails";

// Start the welcome email series for a specific user
await startWelcomeEmailSeries("user-id-here");

// Start the welcome email series for the current authenticated user
await startWelcomeEmailSeries();
```

### Sending a Specific Welcome Email

For testing or other purposes, you can send a specific welcome email:

```typescript
import { sendSpecificWelcomeEmail } from "@/app/actions/welcome-emails";

// Send the day 1 welcome email to a specific user
await sendSpecificWelcomeEmail("day1", "user-id-here");

// Send the day 3 welcome email to the current authenticated user
await sendSpecificWelcomeEmail("day3");
```

## Redis Configuration

The system uses Redis for job queuing. Make sure Redis is running and properly configured:

```
# Environment variables for Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
```

You can use the Docker command provided in the project to run Redis:

```bash
docker run -d --name redis \
  --network global-shared \
  -p 6379:6379 \
  redis:latest
```

## Customizing Email Content

To customize the email content, edit the HTML templates in the `app/emails/templates/` directory. The templates use a simple variable substitution system with the following variables:

### Common Variables in All Templates

- `{{name}}`: The user's name
- `{{unsubscribeUrl}}`: URL for unsubscribing from emails

### Day 1 Email Variables

- `{{dashboardUrl}}`: URL to the dashboard

### Day 3 Email Variables

- `{{featuresUrl}}`: URL to the features page
- `{{tutorialUrl}}`: URL to the tutorial

### Day 7 Email Variables

- `{{templatesUrl}}`: URL to the templates page
- `{{advancedGuideUrl}}`: URL to the advanced guide

## Troubleshooting

### Emails Not Being Sent

1. Check that Redis is running and accessible
2. Verify that the Resend API key is correctly set in the environment variables
3. Check the server logs for any errors related to BullMQ or email sending
4. Ensure the email templates exist and are correctly formatted

### Delayed Emails Not Working

1. Make sure the BullMQ worker is running
2. Check Redis connection and persistence
3. Verify that the server is running continuously (delayed jobs require the server to be running when the delay expires)

## Split Testing

The welcome email system includes A/B testing (split testing) functionality to help optimize email content and improve engagement:

### How Split Testing Works

1. When a user signs up, they are randomly assigned either variant "a" (original) or variant "b" (alternative).
2. This variant assignment is stored in the user's record in the database (`emailVariant` field).
3. All welcome emails in the series will use the same variant for consistency.
4. The system logs which variant is used for each user, enabling analysis of performance differences.

### Email Variants

Each welcome email has two variants:

1. **Variant A**: The original email templates.
2. **Variant B**: Alternative templates with different design, content structure, and messaging approaches.

### Testing Different Elements

The variant templates test different approaches:

- **Visual Design**: Variant B uses a more modern card-based design with stronger visual hierarchy.
- **Messaging Style**: Variant B uses a more conversational tone with personal stories and testimonials.
- **Call-to-Action**: Variant B uses differently worded and styled buttons to test engagement.
- **Content Structure**: Variant B organizes information differently to test what resonates better.

### Tracking and Analysis

The system includes an admin dashboard for tracking and analyzing split test results:

#### Admin Dashboard

The split test dashboard is available at `/admin/email-tests` and provides:

1. **Overview Statistics**:

   - Total users in each variant
   - Overall conversion rates
   - Comparison between variants

2. **Conversion Comparison**:

   - Visual comparison of conversion rates between variants
   - Percentage improvement calculations
   - Recommendations based on performance

3. **Time to Conversion Analysis**:

   - Average days to conversion for each variant
   - Breakdown of when conversions happen (early, mid, or late in the trial period)

4. **Reset Functionality**:
   - Option to reset all variant assignments to start a new test
   - Confirmation dialog to prevent accidental resets

To access the dashboard, navigate to `/admin/email-tests` in your browser when logged in as an admin user. The dashboard is protected with role-based access control - only users with the "admin" role can access it. Non-admin users attempting to access the dashboard will be automatically redirected to the main dashboard page.

#### Manual Analysis

In addition to the dashboard, you can also:

1. Monitor email open rates, click-through rates, and conversion metrics for each variant.
2. Compare user engagement metrics between users who received variant A vs. variant B.
3. Use the insights to refine future email content and design.

### Manually Assigning Variants

For testing purposes, you can manually assign a specific variant:

```typescript
import { startWelcomeEmailSeries } from "@/app/actions/welcome-emails";

// Start the welcome email series with variant "a"
await startWelcomeEmailSeries("user-id-here", "a");

// Start the welcome email series with variant "b"
await startWelcomeEmailSeries("user-id-here", "b");
```

### Sending a Specific Variant for Testing

```typescript
import { sendSpecificWelcomeEmail } from "@/app/actions/welcome-emails";

// Send the day 1 welcome email with variant "b"
await sendSpecificWelcomeEmail("day1", "user-id-here", "b");
```

## Future Improvements

Potential improvements to the welcome email system:

1. Add more sophisticated analytics tracking to monitor email open and click rates
2. Expand split testing to include more variants or multivariate testing
3. Add more personalization based on user behavior
4. Create a dashboard for managing and previewing email templates
5. Add the ability to pause/resume the welcome email series for specific users
