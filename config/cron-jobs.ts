// Define types for cron jobs
export interface CronJob {
	path: string; // API route path that will handle this job
	schedule: string; // Cron schedule expression (e.g., "0 0 * * *" for daily at midnight)
	description: string; // Description of what the job does
	enabled: boolean; // Whether the job is enabled
}

// Define the cron jobs
export const cronJobs: CronJob[] = [
	{
		path: "/api/cron/cleanup-sessions",
		schedule: "0 0 * * *", // Daily at midnight
		description: "Clean up expired sessions",
		enabled: true,
	},
	{
		path: "/api/cron/check-expired-subscriptions",
		schedule: "0 */6 * * *", // Every 6 hours
		description: "Check for expired trials and subscriptions",
		enabled: true,
	},
	{
		path: "/api/cron/weekly-report",
		schedule: "0 9 * * 1", // Every Monday at 9 AM
		description: "Generate weekly reports",
		enabled: true,
	},
	{
		path: "/api/cron/process-scheduled-notifications",
		schedule: "*/1 * * * *",
		description: "Process pending scheduled push notifications",
		enabled: true,
	},
	{
		path: "/api/cron/cleanup-failed-scans",
		// schedule: "*/15 * * * *", // Every 15 minutes
		schedule: "*/15 * * * *",
		description: "Clean up failed or stuck scans older than 15 minutes",
		enabled: true,
	},
	// Add more cron jobs as needed
];

// schedule: "* * * * *", // Every minute
