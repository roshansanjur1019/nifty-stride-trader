# Quick Fix: Sites Not Loading

## ✅ Containers Are Running
All containers are up and Nginx can route internally. The issue is likely:

## 🔍 Most Common Issues

### 1. Browser Trying HTTPS (No Certificates Yet)

**Problem**: Browsers default to HTTPS, but you don't have SSL certificates yet.

**Solution**: Access via HTTP explicitly:
- `http://skyspear.in` (not https://)
- `http://api.skyspear.in` (not https://)

### 2. DNS Not Resolving

**Test DNS**:
```bash
# From your local machine
dig skyspear.in A
dig api.skyspear.in A

# Should return: 34.180.17.77
```

**If DNS is wrong**: Update DNS records at your registrar.

### 3. Firewall Still Blocking

**Check GCP Firewall**:
- Go to: VPC Network → Firewall
- Ensure rules allow port 80 from `0.0.0.0/0`
- Your VM instance has tags: `http-server`, `https-server`

## 🧪 Quick Tests

### From Your Local Machine:

```bash
# Test HTTP (should work)
curl -I http://skyspear.in
curl -I http://api.skyspear.in/health

# Test with IP directly
curl -I -H "Host: skyspear.in" http://34.180.17.77
curl -I -H "Host: api.skyspear.in" http://34.180.17.77/health
```

### From Server (SSH):

```bash
cd /opt/nifty-stride-trader

# Test Nginx directly
curl -H "Host: skyspear.in" http://localhost/
curl -H "Host: api.skyspear.in" http://localhost/health

# Check Nginx config
docker compose exec nginx nginx -t

# Check Nginx logs
docker compose logs nginx --tail=50
```

## 🔧 Quick Fixes

### Fix 1: Test HTTP First
Don't use HTTPS yet - use HTTP:
- ✅ `http://skyspear.in`
- ✅ `http://api.skyspear.in/health`
- ❌ `https://skyspear.in` (will fail - no certificates)

### Fix 2: Get SSL Certificates
Once HTTP works, get SSL certificates:

```bash
cd /opt/nifty-stride-trader
bash init-letsencrypt.sh
```

### Fix 3: Check Nginx Logs
```bash
docker compose logs nginx --tail=100
```

Look for:
- Connection errors
- Routing issues
- 502/503 errors

## 📋 Expected Behavior

**Before SSL certificates**:
- ✅ `http://skyspear.in` → Should load frontend
- ✅ `http://api.skyspear.in/health` → Should return `{"ok":true}`
- ❌ `https://skyspear.in` → Will fail (no certificates)

**After SSL certificates**:
- ✅ `https://skyspear.in` → Should load frontend
- ✅ `https://api.skyspear.in/health` → Should return `{"ok":true}`
- ✅ HTTP automatically redirects to HTTPS

## 🎯 Most Likely Issue

**You're trying HTTPS but certificates don't exist yet!**

**Solution**: Use HTTP for now:
- `http://skyspear.in`
- `http://api.skyspear.in/health`

Then get certificates with `bash init-letsencrypt.sh`

