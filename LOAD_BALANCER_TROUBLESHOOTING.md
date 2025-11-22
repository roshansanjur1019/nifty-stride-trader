# Load Balancer Not Routing - Troubleshooting

## 🔍 Problem
Load balancer is set up, DNS points to it, but traffic still goes to VM IP directly.

## ✅ Quick Fixes

### 1. Check Health Check Status

**In GCP Console:**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click `skyspear-backend`
3. Check **"Backends"** section
4. Should show: **"1 of 1" healthy** (green checkmark)

**If showing unhealthy:**
- Health check path might be wrong
- Update health check to use `/` instead of `/health` for main domain

### 2. Update Health Check Path

**Option A: Change to `/` (Recommended)**
1. Go to: **Network Services → Load Balancing → Backends**
2. Click `skyspear-backend` → **Edit**
3. Click on health check name (`skyspear-health-check`) → **Edit**
4. Change **Request path** from `/health` to `/`
5. **Save**

**Option B: Keep `/health` and add endpoint**
- I've added `/health` endpoint to nginx.conf
- Restart Nginx: `docker compose restart nginx`

### 3. Clear DNS Cache

**Your browser/system might be caching the old VM IP:**

```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows
ipconfig /flushdns

# Linux
sudo systemd-resolve --flush-caches

# Or use different DNS
dig @8.8.8.8 skyspear.in A
```

**In Browser:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or use incognito/private mode

### 4. Verify DNS Resolution

```bash
# Should return Load Balancer IP (34.149.218.63)
dig skyspear.in A +short
dig api.skyspear.in A +short

# NOT the VM IP (34.180.17.77)
```

**If still showing VM IP:**
- Wait 5-30 minutes for DNS propagation
- Check DNS records at registrar are correct

### 5. Test Load Balancer Directly

```bash
# Test load balancer IP directly
curl -I http://34.149.218.63/
curl -I https://34.149.218.63/

# Should return responses (not timeouts)
```

### 6. Check Firewall for Health Checks

GCP health checks need firewall access. Ensure you have:

**Firewall rule for health checks:**
- Source: `130.211.0.0/22,35.191.0.0/16`
- Target: Instances with tag `lb-health-check`
- Port: 80

**Add tag to VM:**
```bash
gcloud compute instances add-tags skyspear-prod01 \
  --zone=asia-south1-b \
  --tags=lb-health-check
```

### 7. Verify Backend Service Configuration

**Check:**
- **Protocol**: HTTP
- **Port**: 80
- **Health check**: Should be passing
- **Instance group**: Should have your VM

## 🎯 Most Likely Issues

1. **Health check failing** - Backend shows unhealthy
   - Fix: Update health check path to `/` or ensure `/health` exists

2. **DNS cache** - Browser/system using old IP
   - Fix: Clear DNS cache, wait for propagation

3. **Health check firewall** - GCP can't reach VM
   - Fix: Add firewall rule for health check IPs

## ✅ Verification

After fixes:

1. **Backend health**: Should show "1 of 1" healthy
2. **DNS**: Should resolve to `34.149.218.63`
3. **Load balancer**: Should route traffic correctly
4. **SSL certificate**: Wait for provisioning (up to 24h)

## 📋 Quick Test Commands

```bash
# 1. Check DNS
dig skyspear.in A +short
# Expected: 34.149.218.63

# 2. Test VM health
curl http://34.180.17.77/health
curl http://34.180.17.77/

# 3. Test load balancer
curl -I http://34.149.218.63/
curl -I https://34.149.218.63/

# 4. Test via domain
curl -I http://skyspear.in
curl -I https://skyspear.in
```

