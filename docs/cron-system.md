# Cron System Documentation

This document explains how to use the cron system in the application. The cron system provides a simple, configuration-based approach to scheduling and running recurring tasks.

## Overview

The cron system uses [node-cron](https://github.com/node-cron/node-cron) to schedule and execute jobs at specified intervals. Jobs are defined in a configuration file and executed by making HTTP requests to API routes.

The cron system runs within a custom Next.js server, which ensures that cron jobs work reliably in both development and production environments, including self-hosted deployments.

## How It Works

1. **Configuration**: Cron jobs are defined in `config/cron-jobs.ts`
2. **Initialization**: The cron service is initialized when the application starts
3. **Execution**: At the scheduled times, the cron service makes HTTP requests to the corresponding API routes
4. **Implementation**: Each job's logic is implemented in a Next.js API route

## Defining Cron Jobs

To define a cron job, add an entry to the `cronJobs` array in `config/cron-jobs.ts`:

```typescript
export const cronJobs: CronJob[] = [
	{
		path: "/api/cron/cleanup-sessions",
		schedule: "0 0 * * *", // Daily at midnight
		description: "Clean up expired sessions",
		enabled: true,
	},
	// Add more jobs here
];
```

### Job Configuration Options

- **path**: The API route path that will handle this job
- **schedule**: A cron schedule expression (e.g., "0 0 \* \* \*" for daily at midnight)
- **description**: A description of what the job does
- **enabled**: Whether the job is enabled

### Cron Schedule Syntax

The schedule uses standard cron syntax:

```
┌────────────── second (optional)
│ ┌──────────── minute
│ │ ┌────────── hour
│ │ │ ┌──────── day of month
│ │ │ │ ┌────── month
│ │ │ │ │ ┌──── day of week
│ │ │ │ │ │
│ │ │ │ │ │
* * * * * *
```

Common examples:

- `0 0 * * *` - Every day at midnight
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month at midnight
- `0 */15 * * *` - Every 15 minutes
- `0 0 */12 * *` - Every 12 hours

## Implementing Cron Job Handlers

Each cron job needs a corresponding API route handler. Create a new file in the `app/api/cron/` directory:

```typescript
// app/api/cron/your-job-name/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		// Verify the cron secret to ensure this is called by our cron service
		const cronSecret = request.headers.get("x-cron-secret");
		const expectedSecret = process.env.CRON_SECRET || "default-cron-secret";

		if (cronSecret !== expectedSecret) {
			return NextResponse.json(
				{ error: "Unauthorized: Invalid cron secret" },
				{ status: 401 }
			);
		}

		// Implement your job logic here
		// ...

		return NextResponse.json({
			success: true,
			message: "Job completed successfully",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error in cron job:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
}
```

## Security

The cron system uses a secret key to authenticate requests. This prevents unauthorized access to your cron job endpoints. The secret is defined in the environment variables:

```
CRON_SECRET=your-secure-random-string
```

Make sure to set this in both your development environment and production environment.

## Environment Variables

The cron system uses the following environment variables:

- `CRON_SECRET`: Secret key for authenticating cron job requests
- `ENABLE_CRON_IN_DEV`: Set to "true" to enable cron jobs in development mode (optional)

## Manually Triggering Jobs

You can manually trigger a cron job by making a POST request to its API route with the correct secret:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: your-secret-here" \
  http://localhost:3000/api/cron/job-name
```

## Running the Custom Server

The cron system runs within a custom Next.js server to ensure reliable execution of scheduled jobs. The custom server is configured in `server.ts` and is used for both development and production environments.

### Development

To run the custom server in development mode:

```bash
npm run dev
```

This command uses ts-node to run the TypeScript server directly without compilation.

### Production

For production, the custom server is automatically used when you run:

```bash
npm run start
```

In a Docker environment, the custom server is configured in the Dockerfile and will be used automatically when the container starts.

## Troubleshooting

### Jobs Not Running

1. Check that the cron service is initialized properly
2. Verify that the job is enabled in the configuration
3. Check the cron schedule expression for correctness
4. Look for errors in the server logs
5. Make sure the custom server is running (not the default Next.js server)

### API Route Errors

1. Check that the API route exists at the specified path
2. Verify that the route handler is implemented correctly
3. Check for errors in the server logs

## Best Practices

1. **Keep Jobs Idempotent**: Design your jobs to be safely re-runnable
2. **Add Logging**: Include detailed logging in your job handlers
3. **Handle Failures Gracefully**: Implement proper error handling
4. **Use Transactions**: For database operations, use transactions to ensure consistency
5. **Monitor Performance**: Keep an eye on job execution times and resource usage
