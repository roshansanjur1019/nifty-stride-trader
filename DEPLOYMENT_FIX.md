# Trading Worker Container Recreation Fix

## Problem
The `trading-worker` container was not being recreated on deployment. It was using a pre-built image (`node:18-alpine`) and mounting volumes, which meant Docker Compose would just check if it's running and leave it as-is.

## Solution
Changed the `trading-worker` service to use a proper Dockerfile build process, similar to the `frontend` service.

## Changes Made

### 1. Created Dockerfile for Trading Worker
**File**: `server/trading-worker/Dockerfile`
- Uses `node:18-alpine` base image
- Installs dependencies from `package.json`
- Copies application code
- Exposes port 4000
- Runs `node index.js`

### 2. Updated docker-compose.yml
**Changes**:
- Changed from `image: node:18-alpine` to `build: context: ./server/trading-worker`
- Removed volume mount (not needed for production)
- Removed inline `npm install` command (now in Dockerfile)
- Added environment variables for Supabase
- Added `restart: unless-stopped` policy
- Added port mapping `4000:4000`

### 3. Updated Deployment Script
**File**: `.github/workflows/deploy.yml`
- Added Supabase environment variables to `.env.hosting`
- Added explicit stop/remove of trading-worker container before build
- Added `trading-worker` to the build command
- Ensures clean rebuild on every deployment

## How It Works Now

1. **On Deployment**:
   ```bash
   # Stop and remove old container
   docker compose stop trading-worker
   docker compose rm -f trading-worker
   
   # Build new image
   docker compose build --no-cache trading-worker
   
   # Start new container
   docker compose up -d
   ```

2. **Container Recreation**:
   - Every deployment will now rebuild the trading-worker image
   - Old container is stopped and removed first
   - New container is created with latest code
   - No more "just checking if running" behavior

## Benefits

1. ✅ **Always Fresh Code**: Container is rebuilt with latest code on every deployment
2. ✅ **Consistent Builds**: Uses Dockerfile for reproducible builds
3. ✅ **No Volume Dependencies**: Code is baked into image, not mounted
4. ✅ **Production Ready**: Follows Docker best practices
5. ✅ **Automatic Restart**: `restart: unless-stopped` ensures container stays running

## Testing

After deployment, verify:
```bash
# Check if container is running
docker ps | grep trading-worker

# Check container logs
docker logs nifty-stride-trader-trading-worker-1

# Check if it's using new code
docker exec nifty-stride-trader-trading-worker-1 node -e "console.log(require('./index.js'))"
```

## Environment Variables Required

Make sure these are in GitHub Secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

These will be added to `.env.hosting` during deployment.

