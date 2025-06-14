# Project summary

airox is a comprehensive SaaS boilerplate designed for the new era of coding where LLMs are integral to the development process. It empowers developers to focus on their vision while AI handles complex tasks such as generating content, managing deployments, and automating workflows.

## Core Features

- **AI-First Architecture**: Built with clean, LLM-friendly code that enables AI agents to understand and modify the codebase effectively
- **Rapid Launch System**: Eliminates common SaaS setup barriers (authentication, database configuration, deployment) to accelerate time-to-market
- **Full-Stack Solution**: Includes everything from frontend components to backend services, cron jobs, queues, and database setup
- **Deployment Options**: One-click deployment to Vercel or self-hosted Docker environments
- **Developer Experience**: Optimized for both AI-assisted development and traditional coding workflows

## Key Benefits

- **Reduced Development Time**: Skip past common implementation challenges that typically slow down SaaS projects
- **AI Integration**: Leverage LLMs for content generation, code assistance, and automation
- **Flexibility**: Adaptable to various SaaS business models and use cases
- **Community Support**: Join a growing community of VibeCoders building with the platform

airox takes developers from idea to deployed reality with minimal friction, handling the complexity while they stay in flow and focus on building their unique vision.

## Founder's Vision

💡 **Why I Built This — Ronny Bruknapp, Founder of airox**

I poured thousands of dollars into API access and spent years fine-tuning how to code with AI—not just alongside it. I started learning to code one year before GPT-4 dropped, giving me a front-row seat to this revolution. airox is the result of obsession, battle-tested workflows, and a belief that LLMs aren't just tools—they're teammates. This is the framework I wish existed when I started. Now it's yours.

# Security

## Sensitive Files

DO NOT read or modify:

- .env files except .env.example

# Tech Stack

## Frontend

- Next.js 15.3.1 with React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components (New York style)
- Lucide icons

## Backend

- Next.js App Router with Server Components and Server Actions
- PostgreSQL with Drizzle ORM
- Redis for caching and job queues
- BullMQ for background job processing
- node-cron for scheduled tasks

## Authentication

- Better Auth library with organization support
- Custom session management

## Payment Processing

- LemonSqueezy integration for subscriptions and payments

## Email

- Resend for email delivery
- HTML templates with variable substitution
- Welcome email series with A/B testing

# Development Guidelines

## General Principles

- Prefer Server Actions for data mutations (Next.js App Router)
- Use server-side data fetching with Suspense for improved performance and UX
- Keep solutions simple without over-complicating
- We are in prelaunch state - optimize for best schema and database setup without migration concerns

## Frontend Development

### Components

- Use shadcn/ui components when they fit the requirements
- Create custom components from scratch when shadcn/ui components don't meet specific needs
- Use the custom typography components from `components/ui/typography.tsx` for consistent text styling

### Typography

Import typography components from `components/ui/typography.tsx`:

```tsx
import { H1, H2, Paragraph, Muted } from "@/components/ui/typography";

// Usage
<H1>Page Title</H1>
<H2>Section Title</H2>
<Paragraph>Regular paragraph text</Paragraph>
<Muted>Small muted text</Muted>
```

### Styling

- Use Tailwind CSS for styling
- Follow the project's color scheme and design system
- Use CSS variables for theme colors

### TypeScript Types

Organize TypeScript types using a hybrid approach:

- **Use Drizzle-Generated Types for Database Entities**:

  - Leverage Drizzle ORM's type generation for database entities
  - Import these types directly from the schema files
  - Example: `import type { User } from "@/lib/db/schema"`
  - Do not duplicate types that are already defined by Drizzle

- **Centralized Types Directory**:

  - Create a dedicated `types/` directory at the root level
  - Organize by domain/feature (e.g., `types/auth.ts`, `types/notifications.ts`)
  - Include index files for easier imports
  - Use for types that aren't directly tied to database entities

- **Co-located Types**:

  - For component-specific types, define them in the same file as the component
  - For complex components, create a separate `[component-name].types.ts` file in the same directory

- **API Types**:
  - Create a `types/api/` subdirectory for API-related types
  - Define request/response types for each API endpoint
  - Use consistent naming: `[Resource][Action]Request` and `[Resource][Action]Response`
  - Reuse Drizzle types where appropriate rather than redefining them

Example implementation:

```typescript
// types/index.ts (barrel file for easy imports)
export * from "./auth";
export * from "./notifications";
// etc.

// types/auth.ts
export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	// etc.
}

export type UserRole = "user" | "admin";

// types/api/notifications.ts
export interface CreateNotificationRequest {
	userId?: string;
	organizationId?: string;
	type: NotificationType;
	title: string;
	message: string;
	// etc.
}
```

Import conventions:

```typescript
// Prefer importing from barrel files
import { User, Session } from "@/types";

// For specific imports when needed
import { CreateNotificationRequest } from "@/types/api/notifications";
```

## Backend Development

### Database

- Use Drizzle ORM for database operations
- PostgreSQL is the primary database
- Follow the schema structure in `lib/db/schema.ts`
- Add relations between tables using Drizzle's relations API

### Server Actions

- Create server actions in the `app/actions/` directory
- Use typed inputs and outputs for better type safety
- Handle errors gracefully and return appropriate error messages

### Data Fetching

- Prefer fetching data on the server in Server Components
- Use React Suspense for loading states with `async`/`await` directly in components
- Implement parallel data fetching when possible to improve performance
- For client-side data fetching needs, use SWR or React Query with proper error handling

## Authentication and Session Management

### Server Components & Server Actions

Use the helpers in `lib/session.ts` to access the session:

```typescript
import {
	getServerSession,
	requireServerSession,
	getCurrentUserId,
	getActiveOrganization,
} from "@/lib/session";

// Get the session (returns null if not authenticated)
const session = await getServerSession();

// Get the session and throw error if not authenticated
const session = await requireServerSession();

// Get just the user ID
const userId = await getCurrentUserId();

// Get the active organization
const activeOrg = await getActiveOrganization();
```

### Client Components

Use the hooks from `lib/auth-client.ts` for client components:

```typescript
import { useSession, useActiveOrganization } from "@/lib/auth-client";

// Access session in client component
const { data: session } = useSession();

// Access active organization in client component
const { data: activeOrg } = useActiveOrganization();
```

## Email System

- Use the email templates in `app/emails/templates/`
- Use the `renderTemplate` function to render templates with data
- Use the `sendEmail` function to send emails

```typescript
import { renderTemplate } from "@/app/emails/render-template";
import { sendEmail } from "@/app/emails";

const html = await renderTemplate("template-name", {
	name: "User Name",
	// other variables
});

await sendEmail({
	to: "user@example.com",
	subject: "Email Subject",
	html,
});
```

## Notification System

Use the notification functions to send notifications to users or organizations:

```typescript
import {
	createNotification,
	createOrganizationNotification,
} from "@/lib/notifications";

// User notification
await createNotification({
	userId: "user-id",
	type: "info",
	title: "Notification Title",
	message: "Notification message",
});

// Organization notification
await createOrganizationNotification({
	organizationId: "org-id",
	singleReadDismissal: true,
	type: "info",
	title: "Organization Notification",
	message: "This is for all organization members",
});
```

## Cron System and Background Jobs

### Cron Jobs

- Define cron jobs in `config/cron-jobs.ts`
- Implement job handlers in `app/api/cron/` directory
- Use the node-cron syntax for scheduling

```typescript
// Example cron job definition
{
  path: "/api/cron/job-name",
  schedule: "0 0 * * *", // Daily at midnight
  description: "Job description",
  enabled: true
}
```

### Background Jobs with BullMQ

- Use BullMQ for processing background jobs
- Create job queues and processors in appropriate files
- Use Redis for job storage

## Welcome Email Series

- The welcome email series sends three onboarding emails over a week
- Uses BullMQ for scheduling delayed emails
- Supports A/B testing with two variants

```typescript
import { startWelcomeEmailSeries } from "@/app/actions/welcome-emails";

// Start welcome email series for a user
await startWelcomeEmailSeries(userId);
```

# Best Practices

1. **Error Handling**: Always handle errors gracefully and provide meaningful error messages
2. **Type Safety**: Use TypeScript types for all functions and components
3. **Performance**: Optimize database queries and use caching where appropriate
4. **Security**: Validate all user inputs and use proper authentication checks
5. **Testing**: Write tests for critical functionality
6. **Documentation**: Document complex functions and components
7. **Code Organization**: Follow the project's directory structure and naming conventions
