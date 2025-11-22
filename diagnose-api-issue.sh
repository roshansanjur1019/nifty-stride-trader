#!/bin/bash
# Diagnostic script to check why api.skyspear.in is not accessible
# Run this on your GCP server: bash diagnose-api-issue.sh

set -e

echo "=========================================="
echo "API Connection Diagnostic Script"
echo "=========================================="
echo ""

# Change to app directory
cd /opt/nifty-stride-trader 2>/dev/null || cd ~/apps/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find application directory"
    echo "Please run this script from the application directory"
    exit 1
}

echo "📁 Working directory: $(pwd)"
echo ""

# 1. Check if docker-compose is available
echo "=== 1. Docker Compose Check ==="
if command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1; then
    echo "✓ Docker Compose is available"
    docker compose version || docker-compose version
else
    echo "❌ Docker Compose not found"
    exit 1
fi
echo ""

# 2. Check container status
echo "=== 2. Container Status ==="
docker compose --env-file .env.angelone --env-file .env.hosting ps || docker compose ps
echo ""

# 3. Check if trading-worker is running
echo "=== 3. Trading-Worker Status ==="
if docker compose --env-file .env.angelone --env-file .env.hosting ps | grep -q "trading-worker.*Up"; then
    echo "✓ Trading-worker container is running"
else
    echo "❌ Trading-worker container is NOT running"
    echo "Attempting to start..."
    docker compose --env-file .env.angelone --env-file .env.hosting up -d trading-worker
    sleep 5
fi
echo ""

# 4. Check trading-worker health (internal)
echo "=== 4. Trading-Worker Health Check (Internal) ==="
if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
    echo "✓ Trading-worker is healthy on port 4000"
    curl -s http://localhost:4000/health
    echo ""
else
    echo "❌ Trading-worker health check FAILED"
    echo "Checking logs..."
    docker compose --env-file .env.angelone --env-file .env.hosting logs --tail=20 trading-worker
fi
echo ""

# 5. Check if Caddy is running
echo "=== 5. Caddy Status ==="
if docker compose --env-file .env.angelone --env-file .env.hosting ps | grep -q "caddy.*Up"; then
    echo "✓ Caddy container is running"
else
    echo "❌ Caddy container is NOT running"
    echo "Attempting to start..."
    docker compose --env-file .env.angelone --env-file .env.hosting up -d caddy
    sleep 5
fi
echo ""

# 6. Check Caddy logs
echo "=== 6. Caddy Logs (last 30 lines) ==="
docker compose --env-file .env.angelone --env-file .env.hosting logs --tail=30 caddy
echo ""

# 7. Check if Caddy can reach trading-worker
echo "=== 7. Caddy → Trading-Worker Connectivity ==="
if docker compose --env-file .env.angelone --env-file .env.hosting exec -T caddy curl -f -s http://trading-worker:4000/health >/dev/null 2>&1; then
    echo "✓ Caddy can reach trading-worker"
    docker compose --env-file .env.angelone --env-file .env.hosting exec -T caddy curl -s http://trading-worker:4000/health
    echo ""
else
    echo "❌ Caddy cannot reach trading-worker"
    echo "This is a critical issue - Caddy needs to connect to trading-worker"
fi
echo ""

# 8. Check ports
echo "=== 8. Port Status ==="
echo "Checking if ports are listening:"
netstat -tuln | grep -E ":(80|443|4000|3000)" || ss -tuln | grep -E ":(80|443|4000|3000)" || echo "Port check unavailable (install net-tools or iproute2)"
echo ""

# 9. Check firewall (GCP)
echo "=== 9. GCP Firewall Check ==="
echo "⚠️  Manual check required in GCP Console:"
echo "   1. Go to: VPC Network → Firewall Rules"
echo "   2. Ensure these rules exist and allow ingress:"
echo "      - Port 80 (HTTP) from 0.0.0.0/0"
echo "      - Port 443 (HTTPS) from 0.0.0.0/0"
echo "      - Port 22 (SSH) from your IP"
echo ""

# 10. Test external connectivity
echo "=== 10. External Connectivity Test ==="
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to determine")
echo "Server Public IP: ${SERVER_IP}"

echo ""
echo "Testing from server:"
if curl -f -s -m 5 http://localhost/health >/dev/null 2>&1 || curl -f -s -m 5 http://127.0.0.1/health >/dev/null 2>&1; then
    echo "✓ Can reach localhost/health"
else
    echo "❌ Cannot reach localhost/health (Caddy might not be working)"
fi

if curl -f -s -m 5 https://localhost/health >/dev/null 2>&1; then
    echo "✓ Can reach localhost/health via HTTPS"
else
    echo "⚠️  Cannot reach localhost/health via HTTPS (SSL might not be ready)"
fi
echo ""

# 11. Check Caddyfile
echo "=== 11. Caddyfile Check ==="
if [ -f "./Caddyfile" ]; then
    echo "✓ Caddyfile exists"
    echo "Contents:"
    cat Caddyfile
else
    echo "❌ Caddyfile not found"
fi
echo ""

# 12. Check environment variables
echo "=== 12. Environment Variables Check ==="
if [ -f ".env.hosting" ]; then
    echo "✓ .env.hosting exists"
    echo "DOMAIN: $(grep DOMAIN .env.hosting | cut -d'=' -f2 || echo 'NOT SET')"
    echo "VITE_BACKEND_URL: $(grep VITE_BACKEND_URL .env.hosting | cut -d'=' -f2 || echo 'NOT SET')"
else
    echo "❌ .env.hosting not found"
fi
echo ""

# 13. DNS verification
echo "=== 13. DNS Verification ==="
DOMAIN=$(grep DOMAIN .env.hosting 2>/dev/null | cut -d'=' -f2 || echo "skyspear.in")
echo "Checking DNS for api.${DOMAIN}:"
dig +short api.${DOMAIN} A || nslookup api.${DOMAIN} || echo "DNS check unavailable"
echo ""

# Summary
echo "=========================================="
echo "Diagnostic Summary"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. If trading-worker is not healthy: Check logs and restart"
echo "2. If Caddy cannot reach trading-worker: Check docker network"
echo "3. If ports are not listening: Check firewall rules in GCP"
echo "4. If DNS is wrong: Verify DNS records at registrar"
echo ""
echo "To restart all services:"
echo "  docker compose --env-file .env.angelone --env-file .env.hosting restart"
echo ""
echo "To view all logs:"
echo "  docker compose --env-file .env.angelone --env-file .env.hosting logs"
echo ""

