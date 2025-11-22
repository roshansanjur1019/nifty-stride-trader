# Fix: API Connection & Midnight Authentication

## 🔍 Issues Identified

### 1. Frontend Can't Connect to API
- Error: `ERR_CONNECTION_REFUSED` to `api.skyspear.in`
- Backend is running and fetching funds successfully
- But frontend can't reach it

### 2. Midnight Authentication Concern
- Authentication cached until midnight IST
- User concerned about refresh at midnight
- How it works in real market conditions

## ✅ Fix 1: API Connection Issue

### Problem
The frontend is trying to connect to `api.skyspear.in` but getting connection refused. This is likely because:

1. **Load balancer not routing correctly**
2. **Nginx not configured for API subdomain**
3. **CORS or network issue**

### Solution

**Check if API is accessible:**

```bash
# From your local machine
curl -I http://api.skyspear.in/health
curl -I https://api.skyspear.in/health

# Should return HTTP 200, not connection refused
```

**If connection refused, check:**

1. **Load balancer routing:**
   - Go to: GCP Console → Load Balancing
   - Check if `api.skyspear.in` is properly routed
   - Verify backend service is healthy

2. **Nginx configuration:**
   - Ensure `api.skyspear.in` server block exists
   - Check if port 80/443 is accessible

3. **Firewall:**
   - Ensure load balancer can reach VM
   - Check GCP firewall rules

## ✅ Fix 2: Midnight Authentication & Refresh

### Current Behavior

**Authentication Cache:**
- Sessions cached until **midnight IST** (12:00 AM IST = 5:30 AM UTC)
- Cache TTL: 23 hours
- Automatically expires at midnight

**Refresh Interval:**
- Frontend: **60 seconds** (not 20 seconds)
- Backend: Checks authentication before each API call
- If cache expired, automatically re-authenticates

### How It Works at Midnight

**Current Implementation:**
```javascript
// Cache expires at midnight IST
const istMidnight = new Date(now)
istMidnight.setUTCHours(0, 0, 0, 0)
istMidnight.setUTCHours(istMidnight.getUTCHours() + 5) // IST = UTC+5:30
istMidnight.setUTCMinutes(istMidnight.getUTCMinutes() + 30)

// If cache expired, re-authenticate
if (cached.expiresAt <= Date.now()) {
  // Re-authenticate automatically
}
```

**At Midnight:**
1. Cache expires (12:00 AM IST)
2. Next API call detects expired cache
3. Automatically re-authenticates with new TOTP
4. New session cached until next midnight
5. **No manual intervention needed**

### Real Market Conditions

**During Market Hours (9:15 AM - 3:30 PM IST):**
- ✅ Authentication cached (no repeated TOTP generation)
- ✅ Fast API calls (no auth overhead)
- ✅ Funds checked every 60 seconds
- ✅ Market data fetched every 15 minutes

**At Midnight (12:00 AM IST):**
- ✅ Cache expires
- ✅ Next API call (within 60 seconds) triggers re-auth
- ✅ New session established automatically
- ✅ Continues working seamlessly

**Weekend/Market Closed:**
- ✅ System detects market closed
- ✅ Skips unnecessary API calls
- ✅ Authentication still cached (for next market open)

### Potential Issue: Midnight Gap

**If API call happens exactly at midnight:**
- Cache might expire mid-request
- Could cause one failed request
- Next request (within 60 seconds) will re-authenticate

**Solution: Add 5-minute buffer before midnight**

I'll update the code to refresh authentication 5 minutes before midnight to avoid any gap.

## 🔧 Recommended Improvements

### 1. Pre-emptive Authentication Refresh

Refresh authentication **5 minutes before midnight** to avoid any gap:

```javascript
// Refresh 5 minutes before midnight
const refreshBuffer = 5 * 60 * 1000 // 5 minutes
if (cached.expiresAt - Date.now() < refreshBuffer) {
  // Re-authenticate before expiry
}
```

### 2. Better Error Handling

If authentication fails at midnight:
- Retry with exponential backoff
- Log the issue
- Continue with cached credentials if possible

### 3. Health Check Endpoint

Add endpoint to check authentication status:
- `/health/auth` - Check if auth is valid
- Frontend can check before making requests

## 📋 Quick Fixes

### Fix API Connection (Immediate)

1. **Test API endpoint:**
   ```bash
   curl http://api.skyspear.in/health
   ```

2. **If fails, check:**
   - Load balancer health check status
   - Nginx logs: `docker compose logs nginx`
   - Backend logs: `docker compose logs trading-worker`

3. **Verify DNS:**
   ```bash
   dig api.skyspear.in A
   # Should return: 34.149.218.63 (load balancer IP)
   ```

### Fix Midnight Authentication (Code Update)

I'll add pre-emptive refresh 5 minutes before midnight to ensure seamless operation.

