#!/bin/bash
# Debug script to check why trading-worker health check is failing

cd /opt/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find /opt/nifty-stride-trader"
    exit 1
}

echo "=== Trading-Worker Health Check Debug ==="
echo ""

# Check if container is running
echo "1. Container Status:"
docker compose ps trading-worker
echo ""

# Check container logs
echo "2. Recent Logs (last 100 lines):"
docker compose logs trading-worker --tail=100
echo ""

# Test health endpoint from inside container
echo "3. Testing health endpoint from inside container:"
docker compose exec trading-worker curl -v http://localhost:4000/health 2>&1 || echo "❌ curl failed"
echo ""

# Test from host
echo "4. Testing health endpoint from host:"
curl -v http://localhost:4000/health 2>&1 || echo "❌ curl failed"
echo ""

# Check if port is listening
echo "5. Checking if port 4000 is listening:"
docker compose exec trading-worker netstat -tlnp 2>/dev/null | grep 4000 || docker compose exec trading-worker ss -tlnp 2>/dev/null | grep 4000 || echo "❌ Port 4000 not listening"
echo ""

# Check environment variables
echo "6. Checking critical environment variables:"
docker compose exec trading-worker env | grep -E "SUPABASE|ANGEL_ONE|PORT" || echo "❌ Cannot check env vars"
echo ""

# Check container health status
echo "7. Container Health Status:"
docker inspect $(docker compose ps -q trading-worker) --format='{{json .State.Health}}' | python3 -m json.tool 2>/dev/null || docker inspect $(docker compose ps -q trading-worker) --format='{{.State.Health.Status}}'
echo ""

echo "=== Debug Complete ==="

