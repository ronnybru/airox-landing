# airox

## Database Setup

Follow these steps to set up your PostgreSQL database and initialize the schema using Drizzle ORM.

1.  **Configure Environment Variables:**

    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Edit the `.env` file and replace the placeholder values with your actual database connection details (host, port, user, password, database name). Ensure the database name matches the one you will create (e.g., `airox`).

2.  **Create the Database:**

    - Connect to your PostgreSQL server (e.g., using `psql`).
    - Run the following SQL command to create the database specified in your `.env` file:
      ```sql
      CREATE DATABASE your_database_name;
      -- Replace your_database_name with the name you set in .env (e.g., airox)
      ```

3.  **Generate and Apply Migrations:**
    - Install project dependencies if you haven't already:
      ```bash
      npm install
      # or yarn install or pnpm install
      ```
    - Generate the initial Drizzle migration files based on the schema:
      ```bash
      npx drizzle-kit generate:pg
      ```
      _(Note: If you modify the schema in `lib/db/schema.ts` or related files later, run this command again to generate new migration files.)_
    - Apply the generated migrations to your database:
      ```bash
      npx drizzle-kit migrate
      ```

Your database should now be set up and ready to use with the application.
