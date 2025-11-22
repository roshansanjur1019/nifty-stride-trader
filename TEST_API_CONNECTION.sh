#!/bin/bash
# Test API connection from various points

echo "=== Testing API Connection ==="
echo ""

# Test 1: Direct VM IP
echo "1. Testing direct VM IP (34.180.17.77):"
curl -I -H "Host: api.skyspear.in" http://34.180.17.77/health 2>&1 | head -5
echo ""

# Test 2: Load Balancer IP
echo "2. Testing Load Balancer IP (34.149.218.63):"
curl -I -H "Host: api.skyspear.in" http://34.149.218.63/health 2>&1 | head -5
echo ""

# Test 3: Domain (HTTP)
echo "3. Testing domain HTTP (api.skyspear.in):"
curl -I http://api.skyspear.in/health 2>&1 | head -5
echo ""

# Test 4: Domain (HTTPS)
echo "4. Testing domain HTTPS (api.skyspear.in):"
curl -I https://api.skyspear.in/health 2>&1 | head -5
echo ""

# Test 5: DNS Resolution
echo "5. DNS Resolution:"
dig api.skyspear.in A +short
echo ""

# Test 6: Get Broker Funds endpoint
echo "6. Testing getBrokerFunds endpoint (should fail without auth):"
curl -X POST http://api.skyspear.in/getBrokerFunds \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","brokerId":"test"}' 2>&1 | head -10
echo ""

echo "=== Test Complete ==="

