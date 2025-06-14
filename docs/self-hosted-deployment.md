# Self-Hosted Deployment Guide

This guide explains how to deploy your application to your own server (VPS) with minimal technical knowledge required. The deployment process is largely automated through GitHub Actions.

## What is Self-Hosting?

Self-hosting means running the application on your own server instead of using a managed hosting service. This gives you complete control over your data and infrastructure.

## Architecture Overview

The self-hosted deployment uses the following components:

```
                    ┌─────────────┐
                    │   GitHub    │
                    │   Actions   │
                    └──────┬──────┘
                           │
                           ▼
┌─────────────────────────────────────────────┐
│                Your VPS                      │
│                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  Caddy  │━━━▶│  Next.js │◀━━▶│ Postgres│  │
│  │(Reverse │    │   App    │    │   DB    │  │
│  │ Proxy)  │    │          │    │         │  │
│  └─────────┘    └─────────┘    └─────────┘  │
│        ▲               ▲                    │
│        │               │                    │
│        └───────────────┘                    │
│               ▲                             │
│               │                             │
│          ┌─────────┐                        │
│          │  Redis  │                        │
│          │         │                        │
│          └─────────┘                        │
└─────────────────────────────────────────────┘
```

- **Caddy**: Handles HTTPS certificates automatically and routes traffic to your application
- **Next.js App**: Your application running in a Docker container
- **Postgres DB**: Database for your application data
- **Redis**: Used for caching and session management

## Quick Start Guide

1. **Prerequisites**:

   - A VPS (Virtual Private Server) with a public IP address
   - A domain name pointing to your VPS
   - A GitHub repository with your application code

2. **Setup Steps**:
   - Fork or clone the repository
   - Update the deployment configuration in `.github/workflows/deploy.yml`
   - Create the `.env.deploy` file on your VPS
   - Push to your main branch to trigger deployment

## Detailed Setup Instructions

### 1. VPS Requirements

- Any Linux VPS with at least 2GB RAM and 1 CPU core
- Ubuntu 20.04 or newer recommended (the deployment script is tested on Ubuntu)
- Root access to the VPS
- A domain name pointing to your VPS's IP address

### 2. GitHub Repository Setup

1. Fork or clone the repository to your own GitHub account
2. Go to your repository settings and enable GitHub Actions
3. Update the deployment configuration in `.github/workflows/deploy.yml`:

```yaml
env:
  APP_NAME: your-app-name # Change this to your preferred name
  DOMAIN: yourdomain.com # Change this to your actual domain
  APP_PORT: 3000
  VPS_USERNAME: root
  VPS_HOST: your-vps-ip-address # Replace with your actual VPS IP
  VPS_PASSWORD: your-vps-password # Replace with your actual VPS password
```

> **Security Note**: For production environments, it's better to use GitHub Secrets instead of hardcoding sensitive information. Go to your GitHub repository → Settings → Secrets and variables → Actions, and add secrets like `VPS_HOST`, `VPS_PASSWORD`, or `VPS_SSH_KEY`.

### 3. Environment Setup

Create a `.env.deploy` file on your VPS with all the necessary environment variables:

1. SSH into your VPS:

   ```bash
   ssh root@your-vps-ip
   ```

2. Create the application directory:

   ```bash
   mkdir -p /opt/your-app-name
   ```

3. Create the `.env.deploy` file:

   ```bash
   nano /opt/your-app-name/.env.deploy
   ```

4. Add the required environment variables:

   ```
   # Authentication
   BETTER_AUTH_SECRET=your-secure-random-string
   BETTER_AUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_APP_URL=https://yourdomain.com

   # Database
   DATABASE_HOST=db
   DATABASE_PORT=5432
   DATABASE_NAME=your-database-name
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your-secure-database-password
   DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@db:5432/${DATABASE_NAME}

   # OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Payment Processing (if using)
   LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
   LEMONSQUEEZY_STORE_ID=your-lemonsqueezy-store-id
   LEMONSQUEEZY_WEBHOOK_SECRET=your-lemonsqueezy-webhook-secret

   # Email System
   RESEND_API_KEY=your-resend-api-key
   EMAIL_FROM=your-email@yourdomain.com

   # Redis
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_URL=redis://redis:6379

   # Application Settings
   APP_NAME=your-app-name
   APP_PORT=3000
   ```

5. Save the file (Ctrl+O, then Enter, then Ctrl+X)

### 4. Domain Setup

Make sure your domain name is pointing to your VPS's IP address:

1. Go to your domain registrar's website
2. Find the DNS settings for your domain
3. Create an A record pointing to your VPS's IP address:

   - Type: A
   - Name: @ (or leave blank for the root domain)
   - Value: Your VPS IP address
   - TTL: 3600 (or the default value)

4. If you want to use www subdomain, create another A record or a CNAME:
   - Type: CNAME
   - Name: www
   - Value: yourdomain.com
   - TTL: 3600 (or the default value)

### 5. Trigger Deployment

Push a change to your main branch to trigger the GitHub Actions workflow:

```bash
git add .
git commit -m "Trigger deployment"
git push
```

Alternatively, you can manually trigger the workflow from the GitHub Actions tab in your repository.

## What Happens During Deployment

The GitHub Actions workflow automates the entire deployment process:

1. **Preparation**:

   - Packages your application code
   - Uploads it to your VPS

2. **Server Setup**:

   - Installs Docker and Docker Compose if not already installed
   - Installs Caddy web server if not already installed
   - Creates a global Docker network for shared services
   - Starts Redis if it's not already running

3. **Caddy Configuration**:

   - Sets up Caddy as a reverse proxy
   - Automatically obtains and renews SSL certificates for your domain
   - Configures redirects from www to non-www (or vice versa)

4. **Application Deployment**:
   - Builds your application using Docker
   - Runs database migrations
   - Starts your application with Docker Compose

## Monitoring and Management

### Viewing Logs

```bash
# SSH into your VPS
ssh root@your-vps-ip

# View application logs
docker logs $(docker ps -q -f name=app)

# Follow application logs in real-time
docker logs -f $(docker ps -q -f name=app)

# View database logs
docker logs $(docker ps -q -f name=db)

# View Caddy logs
journalctl -u caddy
```

### Restarting Services

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to your application directory
cd /opt/your-app-name

# Restart all services
docker compose restart

# Restart just the application
docker compose restart app

# Restart just the database
docker compose restart db

# Restart Caddy
systemctl restart caddy
```

### Updating Your Application

The application will automatically update whenever you push changes to your main branch. If you need to manually update:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Navigate to your application directory
cd /opt/your-app-name

# Pull the latest changes
git pull

# Rebuild and restart the application
docker compose down
docker compose build
docker compose up -d
```

## Troubleshooting

### Common Issues

1. **Application not accessible**:

   - Check if your domain is correctly pointing to your VPS IP
   - Verify that Caddy is running: `systemctl status caddy`
   - Check Caddy logs for errors: `journalctl -u caddy`
   - Ensure your application is running: `docker ps`

2. **Database connection issues**:

   - Check database logs: `docker logs $(docker ps -q -f name=db)`
   - Verify database environment variables in `.env.deploy`
   - Ensure the database container is running: `docker ps | grep db`

3. **SSL certificate issues**:

   - Caddy should automatically obtain SSL certificates
   - Check Caddy logs for certificate errors: `journalctl -u caddy`
   - Ensure your domain is correctly pointing to your VPS IP
   - Make sure ports 80 and 443 are open on your VPS firewall

4. **Deployment workflow fails**:
   - Check the workflow logs in the GitHub Actions tab
   - Verify that all required secrets or environment variables are correctly set
   - Ensure your VPS is accessible from the internet
   - Check if there's enough disk space on your VPS: `df -h`

### Checking Container Status

```bash
# List all running containers
docker ps

# List all containers (including stopped ones)
docker ps -a

# Check container resource usage
docker stats
```

### Viewing Application Logs

```bash
# View all container logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs app
docker compose logs db

# View Redis logs
docker logs redis
```

## Backup and Restore

### Database Backup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Create a backup directory
mkdir -p /opt/backups

# Backup the database
docker exec $(docker ps -q -f name=db) pg_dump -U postgres -d your-database-name > /opt/backups/db-backup-$(date +%Y%m%d).sql
```

### Database Restore

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Restore from a backup file
cat /opt/backups/db-backup-file.sql | docker exec -i $(docker ps -q -f name=db) psql -U postgres -d your-database-name
```

## Security Considerations

1. **Use SSH Keys Instead of Passwords**:

   - Generate an SSH key pair on your local machine
   - Add the public key to your VPS
   - Use the private key for GitHub Actions deployment

2. **Keep Your VPS Updated**:

   ```bash
   apt update && apt upgrade -y
   ```

3. **Enable Firewall**:

   ```bash
   # Install UFW if not already installed
   apt install -y ufw

   # Allow SSH, HTTP, and HTTPS
   ufw allow ssh
   ufw allow http
   ufw allow https

   # Enable the firewall
   ufw enable
   ```

4. **Secure Environment Variables**:
   - Use GitHub Secrets for sensitive information
   - Regularly rotate API keys and passwords
   - Use strong, unique passwords for all services

## Advanced Configuration

### Custom Caddy Configuration

If you need to customize the Caddy configuration:

1. SSH into your VPS
2. Edit the Caddy configuration file:
   ```bash
   nano /etc/caddy/sites-enabled/your-app-name.caddy
   ```
3. Reload Caddy to apply changes:
   ```bash
   systemctl reload caddy
   ```

### Using a Different Database

The default setup uses PostgreSQL, but you can modify the `docker-compose.yml` file to use a different database:

1. SSH into your VPS
2. Edit the Docker Compose file:
   ```bash
   nano /opt/your-app-name/docker-compose.yml
   ```
3. Replace the `db` service with your preferred database
4. Update the `.env.deploy` file with the new database connection details
5. Restart the services:
   ```bash
   docker compose down
   docker compose up -d
   ```

### Scaling Your Application

For higher traffic applications, you might want to scale your application:

1. Increase resources on your VPS (CPU, RAM)
2. Use a managed database service instead of the containerized PostgreSQL
3. Set up a load balancer if using multiple VPS instances
4. Consider using a CDN for static assets

## Conclusion

This guide has walked you through setting up an automated deployment pipeline for your application. The combination of GitHub Actions, Docker, and Caddy provides a robust and secure hosting environment with minimal maintenance required.

If you encounter any issues not covered in the troubleshooting section, check the GitHub repository issues or create a new one for support.
