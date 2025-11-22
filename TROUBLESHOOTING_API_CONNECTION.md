# Troubleshooting: API Connection Timeout (api.skyspear.in)

## Problem
Getting `ERR_CONNECTION_TIMED_OUT` when trying to access `api.skyspear.in`

## Common Causes & Solutions

### 1. DNS Not Configured ⚠️ MOST LIKELY ISSUE

The `api.skyspear.in` subdomain must have a DNS A record pointing to your server's IP.

**Check DNS:**
```bash
# On your local machine or server
dig api.skyspear.in A
nslookup api.skyspear.in
```

**Expected Result:**
```
api.skyspear.in.    IN    A    YOUR_SERVER_IP
```

**Fix:**
1. Go to your domain registrar (where you bought skyspear.in)
2. Add DNS A record:
   - **Name:** `api`
   - **Type:** `A`
   - **Value:** Your GCP server's public IP
   - **TTL:** 300 (or default)

3. Wait for DNS propagation (5-30 minutes)

### 2. Caddy Not Running

**Check:**
```bash
docker compose ps
# Should show caddy container as "Up"
```

**Fix:**
```bash
docker compose logs caddy
# Check for errors
docker compose restart caddy
```

### 3. Trading-Worker Not Running

**Check:**
```bash
docker compose ps trading-worker
curl http://localhost:4000/health
```

**Fix:**
```bash
docker compose logs trading-worker
docker compose restart trading-worker
```

### 4. Firewall Blocking Ports

**GCP Firewall Rules Required:**
- Port 80 (HTTP) - for Caddy
- Port 443 (HTTPS) - for Caddy SSL
- Port 22 (SSH) - for deployment

**Check in GCP Console:**
1. Go to VPC Network > Firewall Rules
2. Ensure rules allow ingress on ports 80, 443, 22

### 5. Caddy SSL Certificate Issues

Caddy automatically gets SSL certificates, but it needs:
- DNS properly configured
- Port 80 and 443 accessible from internet

**Check Caddy logs:**
```bash
docker compose logs caddy | grep -i cert
```

**Manual SSL check:**
```bash
curl -I https://api.skyspear.in/health
```

### 6. Service Connectivity (Internal)

**Test if Caddy can reach trading-worker:**
```bash
docker compose exec caddy curl http://trading-worker:4000/health
```

**Expected:** Should return `{"ok":true}`

## Quick Diagnostic Commands

Run these on your server:

```bash
# 1. Check all containers
docker compose ps

# 2. Check trading-worker health (internal)
curl http://localhost:4000/health

# 3. Check Caddy logs
docker compose logs caddy --tail=50

# 4. Check trading-worker logs
docker compose logs trading-worker --tail=50

# 5. Test Caddy -> trading-worker connectivity
docker compose exec caddy curl http://trading-worker:4000/health

# 6. Check DNS from server
dig api.skyspear.in A +short
nslookup api.skyspear.in

# 7. Get server public IP
curl ifconfig.me
```

## Expected Working State

✅ All containers running:
- `caddy` - Up
- `frontend` - Up  
- `trading-worker` - Up
- `angel-one` - Up

✅ DNS configured:
- `api.skyspear.in` → Server IP

✅ Services accessible:
- `http://localhost:4000/health` returns `{"ok":true}`
- `https://api.skyspear.in/health` returns `{"ok":true}`

## After Fixing DNS

1. Wait 5-30 minutes for DNS propagation
2. Verify DNS: `dig api.skyspear.in A`
3. Restart Caddy: `docker compose restart caddy`
4. Test: `curl https://api.skyspear.in/health`

## Still Not Working?

1. Check deployment logs in GitHub Actions
2. Verify all environment variables are set
3. Check GCP firewall rules
4. Verify domain DNS settings at registrar

