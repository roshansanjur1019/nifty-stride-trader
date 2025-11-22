#!/bin/bash
# Initialize Let's Encrypt certificates
# Run this once on your server after deployment

set -e

DOMAIN="skyspear.in"
EMAIL="roshansanjur@gmail.com"  # Change to your email

echo "=========================================="
echo "Let's Encrypt Certificate Initialization"
echo "=========================================="
echo ""

cd /opt/nifty-stride-trader 2>/dev/null || cd ~/apps/nifty-stride-trader 2>/dev/null || {
    echo "❌ Cannot find application directory"
    exit 1
}

# Check if certificates already exist
if [ -d "./certbot/conf/live/$DOMAIN" ] && [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✓ Certificates already exist for $DOMAIN"
    echo "Skipping certificate generation..."
    exit 0
fi

echo "Starting Nginx with HTTP-only config for certificate generation..."
docker compose --env-file .env.angelone --env-file .env.hosting up -d nginx

echo "Waiting for Nginx to be ready..."
sleep 5

echo "Obtaining certificates for $DOMAIN and api.$DOMAIN..."

# Obtain certificate for main domain
docker compose --env-file .env.angelone --env-file .env.hosting run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# Obtain certificate for API subdomain
docker compose --env-file .env.angelone --env-file .env.hosting run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d api.$DOMAIN

echo ""
echo "✓ Certificates obtained successfully!"
echo ""
echo "Restarting Nginx with SSL configuration..."
docker compose --env-file .env.angelone --env-file .env.hosting restart nginx

echo ""
echo "=========================================="
echo "SSL Setup Complete"
echo "=========================================="
echo ""
echo "Your sites should now be accessible via HTTPS:"
echo "  - https://$DOMAIN"
echo "  - https://api.$DOMAIN"
echo ""
echo "Certificates will auto-renew via certbot container."

