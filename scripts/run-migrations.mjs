// ESM module for running migrations
import "dotenv/config";
import fs from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

// Ensure we have the required environment variables
if (
	!process.env.DATABASE_HOST ||
	!process.env.DATABASE_PORT ||
	!process.env.DATABASE_NAME ||
	!process.env.DATABASE_USER ||
	!process.env.DATABASE_PASSWORD
) {
	console.error("Missing required database environment variables");
	process.exit(1);
}

// Create a PostgreSQL connection pool
const pool = new Pool({
	host: process.env.DATABASE_HOST,
	port: parseInt(process.env.DATABASE_PORT),
	database: process.env.DATABASE_NAME,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
});

// Create a Drizzle ORM instance without schema
// We don't import the schema directly to avoid ESM/CJS compatibility issues
const db = drizzle(pool);

// Function to execute SQL files directly if the migrator fails
async function executeSqlMigrationsDirectly(migrationFiles) {
	console.log("Attempting to execute SQL migrations directly...");

	// Sort migration files to ensure they're executed in order
	const sortedFiles = migrationFiles.sort();

	for (const file of sortedFiles) {
		console.log(`Executing migration file: ${file}`);
		const sql = fs.readFileSync(`drizzle/${file}`, "utf8");

		try {
			// Execute the SQL directly using the pool
			await pool.query(sql);
			console.log(`Successfully executed ${file}`);
		} catch (error) {
			// Check for PostgreSQL error codes that indicate objects already exist
			// 42P07: relation (table, index, etc.) already exists
			// 42701: column already exists
			if (error.code === "42P07" || error.code === "42701") {
				const objectType = error.code === "42P07" ? "relation" : "column";
				console.warn(
					`Warning: Attempted to create a ${objectType} in ${file} that already exists (Code: ${error.code}). This part of the migration was skipped. Original error: ${error.message}`
				);
				// Continue to the next migration file by not re-throwing the error.
			} else {
				console.error(`Error executing ${file}:`, error);
				throw error; // Re-throw other, unexpected errors
			}
		}
	}

	console.log("All SQL migrations executed directly");
}

// Run migrations or push schema
async function runMigrations() {
	try {
		console.log("Checking for migration files...");
		const migrationFiles = fs
			.readdirSync("drizzle")
			.filter((file) => file.endsWith(".sql"));

		if (migrationFiles.length === 0) {
			console.log(
				"No migration files found. Performing initial schema push..."
			);

			// Create a connection string for drizzle-kit push
			const connectionString = `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

			// Use drizzle-kit CLI directly since the import might not work in Docker
			try {
				console.log("Running drizzle-kit push via CLI...");
				// Set the connection string as environment variable for drizzle.config.ts
				process.env.DATABASE_URL = connectionString;
				await execPromise(`npx drizzle-kit push`);
				console.log("Initial schema push completed successfully");
			} catch (pushError) {
				console.error("Error during schema push:", pushError);
				throw pushError;
			}
		} else {
			console.log(
				`Found ${migrationFiles.length} migration files. Running migrations...`
			);

			// Check if meta/_journal.json exists
			const journalPath = "drizzle/meta/_journal.json";
			if (!fs.existsSync("drizzle/meta")) {
				console.log("Creating meta directory...");
				fs.mkdirSync("drizzle/meta", { recursive: true });
			}

			if (!fs.existsSync(journalPath)) {
				console.log("Creating _journal.json file...");

				// Try to copy the existing journal file from the repository
				try {
					// List all files to debug
					console.log("Files in current directory:", fs.readdirSync("."));
					console.log("Files in drizzle directory:", fs.readdirSync("drizzle"));

					// Check if we have a snapshot file we can use
					if (fs.existsSync("drizzle/meta/0001_snapshot.json")) {
						console.log("Found snapshot file, using it to create journal");

						// Create a journal file based on the snapshot
						const journalContent = {
							version: "5",
							dialect: "pg",
							entries: [
								{
									idx: 0,
									version: "7",
									when: Date.now() - 1000,
									tag: "0000_great_scourge",
									breakpoints: true,
								},
								{
									idx: 1,
									version: "7",
									when: Date.now(),
									tag: "0001_add_waitlist_table",
									breakpoints: true,
								},
							],
						};
						fs.writeFileSync(
							journalPath,
							JSON.stringify(journalContent, null, 2)
						);
					} else {
						// Create a basic journal file
						const journalContent = {
							version: "5",
							dialect: "pg",
							entries: [],
						};
						fs.writeFileSync(
							journalPath,
							JSON.stringify(journalContent, null, 2)
						);
					}
				} catch (journalError) {
					console.error("Error creating journal file:", journalError);
					// Create a basic journal file as fallback
					const journalContent = {
						version: "5",
						dialect: "pg",
						entries: [],
					};
					fs.writeFileSync(
						journalPath,
						JSON.stringify(journalContent, null, 2)
					);
				}
			}

			try {
				await migrate(db, { migrationsFolder: "drizzle" });
				console.log("Migrations applied successfully");
			} catch (migrateError) {
				console.error("Error using Drizzle migrator:", migrateError);
				console.log("Falling back to direct SQL execution...");

				// Try direct SQL execution as a fallback
				await executeSqlMigrationsDirectly(migrationFiles);
				console.log("Migrations applied successfully via direct SQL execution");
			}
		}

		// Close the database connection
		await pool.end();
		process.exit(0);
	} catch (error) {
		console.error("Migration/push failed:", error);
		// Make sure to close the pool even on error
		try {
			await pool.end();
		} catch (closeError) {
			console.error("Error closing database connection:", closeError);
		}
		process.exit(1);
	}
}

runMigrations();
