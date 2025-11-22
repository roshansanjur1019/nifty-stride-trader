# Nginx with Let's Encrypt SSL Setup

## ✅ What's Configured

1. **Nginx** - Replaced Caddy with Nginx
2. **Let's Encrypt** - SSL certificate automation via Certbot
3. **Auto-renewal** - Certificates renew automatically every 12 hours

## 🚀 Deployment Steps

### 1. Deploy the Application

Push to main branch - the deployment will:
- Start Nginx with HTTP-only config (for initial certificate generation)
- Start all other services
- Start Certbot for auto-renewal

### 2. Obtain SSL Certificates (One-time setup)

After deployment, SSH into your server and run:

```bash
cd /opt/nifty-stride-trader
bash init-letsencrypt.sh
```

Or manually:

```bash
# Start Nginx first (if not running)
docker compose up -d nginx

# Obtain certificate for main domain
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email roshansanjur@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d skyspear.in \
    -d www.skyspear.in

# Obtain certificate for API subdomain
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email roshansanjur@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d api.skyspear.in

# Restart Nginx to use SSL config
docker compose restart nginx
```

### 3. Verify SSL

After certificates are obtained:

```bash
# Test HTTPS
curl https://skyspear.in
curl https://api.skyspear.in/health
```

## 📋 Configuration Files

- **nginx.conf** - Full SSL configuration (used after certificates are obtained)
- **nginx-init.conf** - HTTP-only config (used initially for certificate generation)
- **init-letsencrypt.sh** - Script to obtain certificates

## 🔄 How It Works

1. **Initial State**: Nginx starts with `nginx-init.conf` (HTTP-only)
2. **Certificate Generation**: Run `init-letsencrypt.sh` to obtain certificates
3. **SSL Activation**: Nginx automatically switches to `nginx.conf` (HTTPS) when certificates exist
4. **Auto-Renewal**: Certbot container runs in background, renewing certificates every 12 hours

## 🔧 Troubleshooting

### Certificates not obtained?

1. Check DNS: `dig skyspear.in A` and `dig api.skyspear.in A`
2. Ensure ports 80 and 443 are open in GCP firewall
3. Check Nginx logs: `docker compose logs nginx`
4. Check Certbot logs: `docker compose logs certbot`

### Nginx not starting?

1. Check config: `docker compose exec nginx nginx -t`
2. Check logs: `docker compose logs nginx`
3. Verify volumes are mounted correctly

### SSL not working?

1. Verify certificates exist: `ls -la certbot/conf/live/`
2. Check Nginx is using SSL config: `docker compose exec nginx cat /etc/nginx/nginx.conf | grep ssl_certificate`
3. Restart Nginx: `docker compose restart nginx`

## 📝 Notes

- Certificates are stored in Docker volume `certbot-conf`
- Certbot webroot files in `certbot-www` volume
- Certificates auto-renew every 12 hours
- Email notifications go to the email specified in certbot command

