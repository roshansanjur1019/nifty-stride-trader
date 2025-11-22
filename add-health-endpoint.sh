#!/bin/bash
# Add /health endpoint to Nginx for load balancer health checks
# This ensures the load balancer can verify the backend is healthy

cd /opt/nifty-stride-trader 2>/dev/null || cd ~/apps/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find application directory"
    exit 1
}

# Check if nginx.conf already has /health for main domain
if grep -q "location /health" nginx.conf; then
    echo "✓ Health endpoint already exists in nginx.conf"
    exit 0
fi

# Create backup
cp nginx.conf nginx.conf.backup

# Add health endpoint to main domain server block
cat > /tmp/nginx_health_patch.txt << 'EOF'
        # Health check endpoint for load balancer
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
EOF

# Insert health endpoint before the closing brace of the main server block
sed -i '/server_name skyspear.in www.skyspear.in;/,/^    }/ {
    /^    }/i\
        # Health check endpoint for load balancer\
        location /health {\
            access_log off;\
            return 200 "healthy\n";\
            add_header Content-Type text/plain;\
        }
}' nginx.conf

echo "✓ Added /health endpoint to nginx.conf"
echo ""
echo "Restarting Nginx..."
docker compose restart nginx

echo ""
echo "✓ Done! Health check should work now."
echo "Test: curl http://localhost/health"

