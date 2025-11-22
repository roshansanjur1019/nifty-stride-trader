# Quick Fix: api.skyspear.in Connection Timeout

## ✅ DNS is Correct
Your DNS is properly configured - all A records point to `34.180.17.77`.

## 🔍 Most Likely Issues

### 1. GCP Firewall Not Allowing Ports 80/443 ⚠️ **MOST COMMON**

**Check in GCP Console:**
1. Go to: **VPC Network → Firewall Rules**
2. Look for rules allowing:
   - **Port 80** (HTTP) from `0.0.0.0/0`
   - **Port 443** (HTTPS) from `0.0.0.0/0`

**If missing, create firewall rules:**
```bash
# Via GCP Console (recommended):
# 1. Click "Create Firewall Rule"
# 2. Name: allow-http-https
# 3. Direction: Ingress
# 4. Action: Allow
# 5. Targets: All instances in the network
# 6. Source IP ranges: 0.0.0.0/0
# 7. Protocols and ports: 
#    - TCP: 80
#    - TCP: 443
# 8. Click Create
```

**Or via gcloud CLI:**
```bash
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP and HTTPS traffic"
```

### 2. Caddy Not Running

**Check on server:**
```bash
cd /opt/nifty-stride-trader
docker compose ps
```

**If Caddy is not running:**
```bash
docker compose up -d caddy
docker compose logs caddy
```

### 3. Trading-Worker Not Running

**Check on server:**
```bash
cd /opt/nifty-stride-trader
docker compose ps trading-worker
curl http://localhost:4000/health
```

**If not running:**
```bash
docker compose up -d trading-worker
docker compose logs trading-worker
```

### 4. Services Not Started

**Restart all services:**
```bash
cd /opt/nifty-stride-trader
docker compose --env-file .env.angelone --env-file .env.hosting down
docker compose --env-file .env.angelone --env-file .env.hosting up -d
```

## 🔧 Run Diagnostic Script

I've created a diagnostic script. **SSH into your server** and run:

```bash
cd /opt/nifty-stride-trader
bash diagnose-api-issue.sh
```

This will check:
- ✅ Container status
- ✅ Trading-worker health
- ✅ Caddy status
- ✅ Internal connectivity
- ✅ Port status
- ✅ Environment variables

## 📋 Quick Checklist

Run these commands on your GCP server:

```bash
# 1. Check all containers
docker compose ps

# 2. Check trading-worker health
curl http://localhost:4000/health

# 3. Check Caddy logs
docker compose logs caddy --tail=50

# 4. Check if ports are listening
sudo netstat -tuln | grep -E ":(80|443)"

# 5. Test from server
curl http://localhost/health
curl https://localhost/health
```

## 🎯 Most Common Fix

**90% of the time, it's the firewall:**

1. Go to GCP Console → VPC Network → Firewall Rules
2. Create/verify rules for ports 80 and 443
3. Wait 1-2 minutes
4. Test: `curl https://api.skyspear.in/health`

## 🆘 Still Not Working?

1. **Check deployment logs** in GitHub Actions
2. **Run diagnostic script**: `bash diagnose-api-issue.sh`
3. **Check Caddy logs**: `docker compose logs caddy`
4. **Verify all containers**: `docker compose ps`

## Expected Working State

✅ All containers running:
```
caddy              Up
frontend           Up
trading-worker     Up
angel-one          Up
```

✅ Health checks pass:
```bash
curl http://localhost:4000/health  # Returns {"ok":true}
curl https://api.skyspear.in/health # Returns {"ok":true}
```

✅ Firewall allows:
- Port 80 (HTTP)
- Port 443 (HTTPS)

