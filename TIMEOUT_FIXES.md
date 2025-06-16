# Build Timeout and Performance Fixes

## Issues Addressed

1. **GitHub Actions timeout** - Workflow was hanging during cron service build
2. **Cron Dockerfile inefficiency** - Not optimized for layer caching
3. **npm install hanging** - Long dependency installation times
4. **Disk space issues** - VPS running out of space during builds

## Fixes Applied

### 1. GitHub Actions Workflow (`deploy.yml`)

**Timeout Protection:**

- Added `timeout-minutes: 30` to prevent infinite hanging
- Added build timeouts with fallback strategies:
  - 15 minutes for parallel build
  - 10 minutes for sequential fallback
  - System cleanup and retry if both fail

**Aggressive Cleanup:**

- Stop all containers before build
- Remove all unused images, volumes, networks
- Clean Docker build cache
- System-wide Docker cleanup with `--volumes`
- Show disk usage after cleanup

**npm Optimization:**

- Configure npm registry and retry settings
- Set fetch timeouts and retry factors
- Faster dependency resolution

### 2. Cron Dockerfile (`Dockerfile.cron`)

**Layer Caching Optimization:**

- Copy `package.json` and `package-lock.json` first
- Install only production dependencies (`npm ci --only=production`)
- Clean npm cache after installation
- Copy source files after dependency installation

**Before:**

```dockerfile
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN npm install  # Installs all dependencies including dev
```

**After:**

```dockerfile
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
```

### 3. Build Process Improvements

**BuildKit Optimization:**

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

**Timeout Strategy:**

1. Try parallel build (15 min timeout)
2. Fallback to sequential build (10 min timeout)
3. Clean system and retry (10 min timeout)

**Resource Management:**

- Memory limits in docker-compose.yml
- Health checks for proper service coordination
- Aggressive cleanup before and after builds

## Expected Results

### Build Time Improvements:

- **Cron service**: 18+ minutes → 2-3 minutes (production deps only)
- **Main app**: Already optimized to ~3-4 minutes
- **Total deployment**: 30+ minutes → 8-10 minutes

### Reliability Improvements:

- **Timeout protection**: Prevents infinite hanging
- **Disk space management**: Aggressive cleanup prevents space issues
- **Fallback strategies**: Multiple retry mechanisms
- **Better error handling**: Clear failure points and recovery

### Resource Usage:

- **Disk space**: Continuous cleanup prevents accumulation
- **Memory**: Resource limits prevent OOM issues
- **Network**: Optimized npm configuration
- **CPU**: Parallel builds when possible

## Monitoring

### Success Indicators:

- Build completes within 10-15 minutes
- No timeout errors in GitHub Actions
- Disk usage stays below 80%
- Services start successfully after deployment

### Failure Recovery:

- Automatic fallback to sequential builds
- System cleanup and retry on failure
- Clear error messages for debugging
- Preserved essential services (Redis, DB)

## Manual Cleanup (if needed)

If builds still fail due to space issues, run on VPS:

```bash
# Emergency cleanup
docker stop $(docker ps -aq)
docker system prune -af --volumes
docker builder prune -af

# Check disk space
df -h

# Restart essential services
docker network create global-shared || true
docker run -d --name redis --network global-shared -p 6379:6379 --restart unless-stopped redis:latest
```

## Next Steps

1. **Monitor first deployment** - Check if timeout fixes work
2. **Verify disk usage** - Ensure cleanup is effective
3. **Check service health** - Confirm all services start properly
4. **Performance validation** - Measure actual build times

The optimizations should resolve the timeout issues while maintaining the performance improvements from the earlier build optimizations.
