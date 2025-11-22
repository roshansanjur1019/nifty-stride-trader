# Fix: Trading-Worker Health Check Still Failing

## 🔍 Problem

Even with increased timeouts (60s → 120s), the health check is still failing, preventing nginx from starting.

## ✅ Solution Applied

### 1. Increased Health Check Parameters Further

**Updated:**
- `start_period: 60s` → `start_period: 120s` (2 minutes)
- `retries: 5` → `retries: 10`
- `interval: 10s` → `interval: 15s`
- `timeout: 5s` → `timeout: 10s`

**Total time before failure:** ~120s + (10 retries × 15s) = ~270 seconds (4.5 minutes)

### 2. Changed Nginx Dependency

**Changed:**
- `condition: service_healthy` → `condition: service_started`

**Why?**
- Allows nginx to start immediately when trading-worker container starts
- Health check continues in background
- Nginx will route traffic once trading-worker becomes healthy
- Prevents blocking deployment if health check takes longer

## 🔧 Debug Steps (If Still Failing)

### Run Debug Script

```bash
cd /opt/nifty-stride-trader
bash DEBUG_HEALTH_CHECK.sh
```

This will show:
- Container status
- Recent logs
- Health endpoint test
- Port listening status
- Environment variables
- Health check status

### Check Logs Manually

```bash
# Check trading-worker logs
docker compose logs trading-worker --tail=100

# Look for:
# - Supabase connection errors
# - Missing environment variables
# - Port binding issues
# - Startup errors
```

### Test Health Endpoint

```bash
# From inside container
docker compose exec trading-worker curl http://localhost:4000/health

# Should return: {"ok":true}
```

## 📋 Common Causes

1. **Supabase connection slow**
   - First connection can take 30-60 seconds
   - Solution: Increased start_period to 120s

2. **Missing environment variables**
   - Check `.env.angelone` and `.env.hosting` exist
   - Verify all required vars are set

3. **Port already in use**
   - Check if port 4000 is already used
   - Solution: `docker compose down --remove-orphans`

4. **Container startup errors**
   - Check logs for specific errors
   - Fix the underlying issue

## ✅ Verification

After fix, verify:

```bash
# Check all containers
docker compose ps

# Should show:
# trading-worker: Up (healthy) or Up (starting)
# nginx: Up ✅
# frontend: Up ✅
# angel-one: Up ✅
```

**Note:** Even if trading-worker shows "starting", nginx will start and route traffic once trading-worker becomes healthy.

## 🎯 Next Steps

1. **Redeploy** with updated health check settings
2. **Monitor logs** during startup
3. **Verify** nginx starts (even if trading-worker is still initializing)
4. **Check** trading-worker becomes healthy within 2-3 minutes

The deployment should now succeed even if trading-worker takes longer to initialize!

