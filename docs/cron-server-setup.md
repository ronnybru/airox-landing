# Cron Server Setup

This document explains the new architecture for running cron jobs in a separate container while maintaining Next.js optimizations in the main application.

## Overview

Instead of running cron jobs in the same container as the Next.js application (which would require a custom server and disable Next.js optimizations), we've moved the cron functionality to a dedicated container. This approach allows us to:

1. Keep the Next.js application using the standalone output mode for optimizations
2. Run cron jobs reliably in a separate container
3. Maintain a clean separation of concerns

## Architecture

The system consists of two main containers:

1. **App Container**: Runs the optimized Next.js application with standalone output
2. **Cron Container**: Runs a dedicated cron server that schedules and triggers jobs by making HTTP requests to the App Container

```
┌─────────────────┐     HTTP Requests     ┌─────────────────┐
│                 │ ──────────────────>   │                 │
│  Cron Container │                       │  App Container  │
│                 │ <──────────────────   │                 │
└─────────────────┘     HTTP Responses    └─────────────────┘
```

## Configuration

### Docker Compose

The setup is defined in `docker-compose.yml`, which includes both containers:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    # ... other configuration

  cron:
    build:
      context: .
      dockerfile: Dockerfile.cron
    environment:
      - NEXT_PUBLIC_APP_URL=http://app:3000
    depends_on:
      - app
    # ... other configuration
```

### Cron Server

The cron server is implemented in `cron-server.ts`, which:

1. Loads the cron job configuration from `config/cron-jobs.ts`
2. Schedules each enabled job using node-cron
3. Makes HTTP requests to the App Container to trigger the jobs
4. Provides a simple health check endpoint

## How It Works

1. The cron server reads the job configuration from `config/cron-jobs.ts`
2. For each enabled job, it schedules a task using node-cron
3. When a job is triggered, the cron server makes an HTTP request to the corresponding API route in the App Container
4. The API route in the App Container executes the job logic and returns a response
5. The cron server logs the result

## Security

The cron server authenticates its requests to the App Container using a secret key (`CRON_SECRET`). This prevents unauthorized access to the cron job endpoints.

## Deployment

Both containers are deployed together using Docker Compose. The Cron Container depends on the App Container, ensuring that the App Container is started first.

## Monitoring

The Cron Container exposes a simple HTTP endpoint for health checks, which returns information about the scheduled jobs.

## Troubleshooting

If cron jobs are not running as expected:

1. Check the logs of the Cron Container for errors
2. Verify that the App Container is accessible from the Cron Container
3. Ensure that the `CRON_SECRET` is correctly set in both containers
4. Check that the job is enabled in the configuration
