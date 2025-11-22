#!/bin/bash
# Test connectivity without requiring curl in Caddy container
# Run this on your GCP server

set -e

cd /opt/nifty-stride-trader 2>/dev/null || cd ~/apps/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find application directory"
    exit 1
}

echo "=========================================="
echo "Connectivity Test (No curl in Caddy)"
echo "=========================================="
echo ""

# Test 1: Trading-worker health directly
echo "=== Test 1: Trading-Worker Health (Direct) ==="
if curl -f -s http://localhost:4000/health >/dev/null 2>&1; then
    echo "✓ Trading-worker is healthy"
    curl -s http://localhost:4000/health
    echo ""
else
    echo "❌ Trading-worker is NOT responding"
    exit 1
fi

# Test 2: Check if containers are on same network
echo "=== Test 2: Docker Network Check ==="
NETWORK_NAME=$(docker compose config | grep -A 5 "networks:" | grep -v "^#" | head -1 | awk '{print $1}' | tr -d ':')
if [ -z "$NETWORK_NAME" ]; then
    NETWORK_NAME="nifty-stride-trader_default"
fi

echo "Network: $NETWORK_NAME"

CADDY_CONTAINER=$(docker compose ps caddy -q)
TRADING_CONTAINER=$(docker compose ps trading-worker -q)

if [ -z "$CADDY_CONTAINER" ] || [ -z "$TRADING_CONTAINER" ]; then
    echo "❌ Containers not found"
    exit 1
fi

echo "Caddy container: $CADDY_CONTAINER"
echo "Trading-worker container: $TRADING_CONTAINER"

# Get trading-worker IP
TRADING_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $TRADING_CONTAINER)
echo "Trading-worker IP: $TRADING_IP"

# Test 3: Test from host to trading-worker IP
echo ""
echo "=== Test 3: Host to Trading-Worker (via IP) ==="
if curl -f -s http://$TRADING_IP:4000/health >/dev/null 2>&1; then
    echo "✓ Host can reach trading-worker at $TRADING_IP:4000"
    curl -s http://$TRADING_IP:4000/health
    echo ""
else
    echo "❌ Host cannot reach trading-worker at $TRADING_IP:4000"
fi

# Test 4: Test Caddy reverse proxy locally
echo "=== Test 4: Caddy Reverse Proxy (Local) ==="
if curl -f -s -H "Host: api.skyspear.in" http://localhost/health >/dev/null 2>&1; then
    echo "✓ Caddy reverse proxy is working"
    curl -s -H "Host: api.skyspear.in" http://localhost/health
    echo ""
else
    echo "❌ Caddy reverse proxy is NOT working"
    echo "This means Caddy can't route to trading-worker"
fi

# Test 5: Check if Caddy can resolve trading-worker hostname
echo "=== Test 5: DNS Resolution in Caddy ==="
CADDY_NSLOOKUP=$(docker compose exec -T caddy nslookup trading-worker 2>/dev/null || echo "nslookup not available")
if echo "$CADDY_NSLOOKUP" | grep -q "$TRADING_IP"; then
    echo "✓ Caddy can resolve trading-worker hostname"
else
    echo "⚠️  Cannot verify DNS resolution (nslookup may not be available)"
fi

# Test 6: Use wget if available in Caddy
echo ""
echo "=== Test 6: Caddy to Trading-Worker (using wget) ==="
if docker compose exec -T caddy wget -q -O- http://trading-worker:4000/health 2>/dev/null; then
    echo "✓ Caddy CAN reach trading-worker via wget"
else
    echo "❌ Caddy cannot reach trading-worker (wget failed or not available)"
    echo "Trying with IP address..."
    if docker compose exec -T caddy wget -q -O- http://$TRADING_IP:4000/health 2>/dev/null; then
        echo "✓ Caddy CAN reach trading-worker via IP"
        echo "⚠️  But hostname resolution may be broken"
    else
        echo "❌ Caddy cannot reach trading-worker even via IP"
        echo "This indicates a Docker network issue"
    fi
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If Test 4 fails, Caddy cannot route to trading-worker."
echo "This could be due to:"
echo "1. Docker network configuration"
echo "2. Caddyfile configuration"
echo "3. Trading-worker not responding"
echo ""
echo "To fix:"
echo "1. Restart containers: docker compose restart caddy trading-worker"
echo "2. Check Caddyfile: cat Caddyfile"
echo "3. Check trading-worker logs: docker compose logs trading-worker"
echo ""

