# Fix: Load Balancer Not Routing Traffic

## 🔍 Problem
Load balancer is set up and DNS points to it, but traffic is still going to VM IP directly.

## ✅ Quick Checks

### 1. Verify DNS Propagation

```bash
# From your local machine
dig skyspear.in A
dig api.skyspear.in A

# Should return: 34.149.218.63 (Load Balancer IP)
# NOT: 34.180.17.77 (VM IP)
```

**If DNS still shows VM IP:**
- Wait 5-30 minutes for DNS propagation
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS) or `ipconfig /flushdns` (Windows)

### 2. Check Health Check Status

**In GCP Console:**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click on `skyspear-backend`
3. Check **"Backends"** section
4. Should show: **"1 of 1" healthy** (green checkmark)

**If showing unhealthy:**
- Health check path might be wrong
- VM might not be responding on port 80
- Firewall might be blocking health checks

### 3. Verify Health Check Configuration

**Health check should be:**
- **Protocol**: HTTP
- **Port**: 80
- **Request path**: `/health` (or `/` if frontend doesn't have /health)
- **Check interval**: 10 seconds
- **Timeout**: 5 seconds
- **Healthy threshold**: 2
- **Unhealthy threshold**: 3

**To check/update:**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click `skyspear-backend` → **Edit**
3. Check **Health check** configuration
4. If wrong, update it

### 4. Test Health Check Manually

**From your local machine:**
```bash
# Test if health check endpoint works
curl http://34.180.17.77/health
# Should return: {"ok":true}

# Test main domain
curl http://34.180.17.77/
# Should return HTML (frontend)
```

**If these fail:**
- Nginx might not be running
- Port 80 might be blocked
- Health check path doesn't exist

### 5. Check Load Balancer Status

**In GCP Console:**
1. Go to: **Network Services → Load Balancing → Load balancers**
2. Click on `skyspear-url-map`
3. Check **"Backends"** section
4. Should show: **"1 backend service (1 instance group, 0 network endpoint groups)"** with green checkmark

### 6. Verify Backend Service Port

**Backend service should:**
- **Protocol**: HTTP
- **Named port**: `http` (port 80)
- **Timeout**: 30 seconds

**To check:**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click `skyspear-backend`
3. Verify **"Endpoint protocol"** is **HTTP**
4. Verify **"Named port"** is **http** (port 80)

### 7. Check Instance Group Configuration

**Instance group should:**
- **Port**: 80
- **Balancing mode**: Max backend utilization: 80%
- **Capacity**: 100%

**To check:**
1. Go to: **Compute Engine → Instance groups**
2. Click `skyspear-instance-group`
3. Check **"Port"** is set to **80**

## 🔧 Common Fixes

### Fix 1: Health Check Path Wrong

If health check is using `/health` but your frontend doesn't have it:

**Option A: Update health check to use `/`**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click `skyspear-backend` → **Edit**
3. Click on health check name → **Edit**
4. Change **Request path** from `/health` to `/`
5. Save

**Option B: Add /health endpoint to frontend**
- Add a simple health check route that returns 200 OK

### Fix 2: Health Check Failing

**Check Nginx is running:**
```bash
# SSH into VM
docker compose ps nginx
# Should show: Up

# Check Nginx logs
docker compose logs nginx --tail=50
```

**Check if port 80 is accessible:**
```bash
# From VM
curl http://localhost/
curl http://localhost/health
```

### Fix 3: Firewall Blocking Health Checks

GCP health checks come from specific IP ranges. Ensure firewall allows:

**Create firewall rule for health checks:**
```bash
gcloud compute firewall-rules create allow-lb-health-checks \
  --source-ranges=130.211.0.0/22,35.191.0.0/16 \
  --target-tags=lb-health-check \
  --allow tcp:80
```

**Add tag to VM:**
```bash
gcloud compute instances add-tags skyspear-prod01 \
  --zone=asia-south1-b \
  --tags=lb-health-check
```

### Fix 4: DNS Cache

**Clear DNS cache:**
```bash
# macOS
sudo dscacheutil -flushcache

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches
```

**Or test with different DNS:**
```bash
# Use Google DNS
dig @8.8.8.8 skyspear.in A
```

## 🎯 Most Likely Issues

1. **Health check failing** - Check health check path and VM response
2. **DNS not propagated** - Wait or clear cache
3. **Firewall blocking health checks** - Add health check firewall rule
4. **Backend service misconfigured** - Check port and protocol

## ✅ Verification Steps

After fixes:

1. **Check health check status:**
   - Backend should show "1 of 1" healthy

2. **Test DNS:**
   ```bash
   dig skyspear.in A
   # Should return: 34.149.218.63
   ```

3. **Test load balancer:**
   ```bash
   curl -I http://skyspear.in
   curl -I https://skyspear.in
   ```

4. **Check SSL certificate:**
   - Should show "ACTIVE" for all domains (wait up to 24h for provisioning)

## 📋 Quick Diagnostic Commands

```bash
# 1. Check DNS
dig skyspear.in A +short
# Should return: 34.149.218.63

# 2. Test VM directly
curl http://34.180.17.77/health
curl http://34.180.17.77/

# 3. Test load balancer
curl -I http://34.149.218.63/
curl -I https://34.149.218.63/

# 4. Test via domain
curl -I http://skyspear.in
curl -I https://skyspear.in
```

