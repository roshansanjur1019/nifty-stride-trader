#!/bin/bash
# Script to verify Caddy can reach trading-worker
# Run this on your GCP server

set -e

echo "=========================================="
echo "Caddy to Trading-Worker Connectivity Check"
echo "=========================================="
echo ""

cd /opt/nifty-stride-trader 2>/dev/null || cd ~/apps/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find application directory"
    exit 1
}

# Check if containers are running
echo "=== Container Status ==="
docker compose ps
echo ""

# Check trading-worker health directly
echo "=== Trading-Worker Health (Direct) ==="
if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
    echo "✓ Trading-worker is healthy on localhost:4000"
    curl -s http://localhost:4000/health
    echo ""
else
    echo "❌ Trading-worker is NOT responding on localhost:4000"
    echo "Checking logs..."
    docker compose logs --tail=20 trading-worker
    exit 1
fi

# Check if Caddy can reach trading-worker by service name
echo "=== Caddy to Trading-Worker (Service Name) ==="
if docker compose exec -T caddy curl -f -s http://trading-worker:4000/health >/dev/null 2>&1; then
    echo "✓ Caddy CAN reach trading-worker via service name"
    docker compose exec -T caddy curl -s http://trading-worker:4000/health
    echo ""
else
    echo "❌ Caddy CANNOT reach trading-worker via service name"
    echo ""
    echo "Checking Docker network..."
    echo "Trading-worker container IP:"
    docker compose exec -T trading-worker hostname -i || echo "Cannot get IP"
    echo ""
    echo "Caddy container IP:"
    docker compose exec -T caddy hostname -i || echo "Cannot get IP"
    echo ""
    echo "Testing with container IP..."
    TRADING_IP=$(docker compose exec -T trading-worker hostname -i | tr -d ' \n')
    if [ -n "$TRADING_IP" ]; then
        if docker compose exec -T caddy curl -f -s http://$TRADING_IP:4000/health >/dev/null 2>&1; then
            echo "✓ Caddy CAN reach trading-worker via IP: $TRADING_IP"
        else
            echo "❌ Caddy CANNOT reach trading-worker even via IP"
        fi
    fi
fi

# Check Caddy configuration
echo ""
echo "=== Caddy Configuration ==="
echo "Caddyfile contents:"
cat Caddyfile
echo ""

# Test Caddy's reverse proxy
echo "=== Testing Caddy Reverse Proxy ==="
echo "Testing api.skyspear.in from inside Caddy container:"
if docker compose exec -T caddy curl -f -s -H "Host: api.skyspear.in" http://localhost/health >/dev/null 2>&1; then
    echo "✓ Caddy reverse proxy is working internally"
    docker compose exec -T caddy curl -s -H "Host: api.skyspear.in" http://localhost/health
    echo ""
else
    echo "❌ Caddy reverse proxy is NOT working"
    echo "This means Caddy can't route requests to trading-worker"
fi

# Check recent Caddy logs for errors
echo ""
echo "=== Recent Caddy Logs (Errors Only) ==="
docker compose logs caddy --tail=50 | grep -i error || echo "No errors in recent logs"
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If Caddy cannot reach trading-worker:"
echo "1. Check Docker network: docker network ls"
echo "2. Restart both containers: docker compose restart caddy trading-worker"
echo "3. Check if they're on the same network: docker network inspect <network_name>"
echo ""

