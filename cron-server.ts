import cron from "node-cron";
import { cronJobs } from "./config/cron-jobs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize cron jobs
function initCronJobs() {
	console.log("Initializing cron jobs in dedicated cron server...");

	// Schedule each enabled cron job
	for (const job of cronJobs) {
		if (job.enabled) {
			try {
				// Validate the cron schedule expression
				if (!cron.validate(job.schedule)) {
					console.error(
						`Invalid cron schedule for job ${job.path}: ${job.schedule}`
					);
					continue;
				}

				console.log(
					`Scheduling cron job: ${job.description} (${job.schedule})`
				);

				cron.schedule(job.schedule, async () => {
					try {
						// Get the base URL - in Docker, this will be the app service
						const baseUrl =
							process.env.NEXT_PUBLIC_APP_URL || "http://app:3000";

						// Construct the full URL
						const url = `${baseUrl}${job.path}`;

						console.log(`Executing cron job: ${job.description} (${url})`);

						// Make a POST request to the API route
						const response = await fetch(url, {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								// Add a secret key for authentication
								"x-cron-secret":
									process.env.CRON_SECRET || "default-cron-secret",
							},
							body: JSON.stringify({
								jobName: job.path.split("/").pop(),
								timestamp: new Date().toISOString(),
							}),
						});

						if (!response.ok) {
							throw new Error(
								`Failed to execute cron job: ${response.status} ${response.statusText}`
							);
						}

						const result = await response.json();
						console.log(`Cron job executed successfully:`, result);
					} catch (error) {
						console.error(`Error executing cron job ${job.path}:`, error);
					}
				});

				console.log(`Scheduled cron job: ${job.description} (${job.schedule})`);
			} catch (error) {
				console.error(`Error scheduling cron job ${job.path}:`, error);
			}
		} else {
			console.log(`Skipping disabled cron job: ${job.description}`);
		}
	}

	console.log(
		`Initialized ${cronJobs.filter((job) => job.enabled).length} cron jobs`
	);
}

// Initialize cron jobs immediately
initCronJobs();

// Keep the process running
console.log("Cron server is running...");

// Create a simple HTTP server for health checks
import { createServer } from "http";
const port = parseInt(process.env.PORT || "3001", 10);

createServer((req, res) => {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			status: "ok",
			message: "Cron server is running",
			cronJobs: cronJobs
				.filter((job) => job.enabled)
				.map((job) => ({
					path: job.path,
					schedule: job.schedule,
					description: job.description,
				})),
		})
	);
}).listen(port);

console.log(
	`> Cron server listening at http://localhost:${port} for health checks`
);
