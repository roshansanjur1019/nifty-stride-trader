# GCP Load Balancer with Managed SSL Certificates

## ✅ Why GCP Load Balancer?

- **Automatic SSL certificates** - No certbot, no manual renewal
- **Global load balancing** - Better performance
- **DDoS protection** - Built-in security
- **Simpler setup** - No certificate management
- **Production-ready** - Google-managed infrastructure

## 🚀 Setup Steps

### Step 1: Create Backend Service

1. Go to: **Network Services → Load Balancing**
2. Click **"Create Load Balancer"**
3. Choose **"Application Load Balancer (HTTP/HTTPS)"**
4. Click **"Start Configuration"**

### Step 2: Configure Frontend

1. **Name**: `skyspear-lb`
2. **Type**: **HTTPS**
3. **IP version**: **IPv4**
4. **IP address**: **Create new IP address** (or use existing)
   - Name: `skyspear-ip`
   - Type: **Global**
5. **Certificate**: **Create Google-managed certificate**
   - Name: `skyspear-ssl-cert`
   - Domains: 
     - `skyspear.in`
     - `www.skyspear.in`
     - `api.skyspear.in`
6. Click **"Create"**

### Step 3: Configure Backend

1. **Backend services**: Click **"Backend services & backend buckets"**
2. Click **"Create a backend service"**
3. **Name**: `  `
4. **Backend type**: **Instance group**
5. **Protocol**: **HTTP**
6. **Port**: **80**
7. **Instance group**: 
   - Click **"Create instance group"**
   - **Name**: `skyspear-instance-group`
   - **Location**: **Single zone** (select your VM's zone)
   - **Instance template**: Create new or use existing
   - **Instances**: Add your VM instance (`skyspear-prod01`)
8. **Health check**: Create new
   - **Name**: `skyspear-health-check`
   - **Protocol**: **HTTP**
   - **Port**: **80**
   - **Request path**: `/health` (or `/` for frontend)
9. Click **"Create"**

### Step 4: Configure Routing Rules

1. **Host and path rules**: 
   - **Default**: `skyspear-backend`
   - **Add rule**:
     - **Hosts**: `api.skyspear.in`
     - **Backend**: `skyspear-backend` (or create separate backend for API)
     - **Path**: `/`

### Step 5: Review and Create

1. Review configuration
2. Click **"Create"**
3. Wait 5-10 minutes for provisioning

### Step 6: Update DNS

After load balancer is created:

1. Get the **IP address** from Load Balancer details
2. Update DNS records at your registrar:
   - **A record**: `skyspear.in` → Load Balancer IP
   - **A record**: `www.skyspear.in` → Load Balancer IP
   - **A record**: `api.skyspear.in` → Load Balancer IP

### Step 7: Wait for SSL Certificate

- SSL certificate provisioning takes **15-60 minutes**
- Check status in: **Network Services → Load Balancing → Certificates**
- Status should change from "Provisioning" to "Active"

## 🔧 Simplified Nginx Config (Behind Load Balancer)

Since the load balancer handles SSL termination, Nginx only needs HTTP:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream trading_worker {
        server trading-worker:4000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Main domain - frontend
    server {
        listen 80;
        server_name skyspear.in www.skyspear.in;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API subdomain - trading worker
    server {
        listen 80;
        server_name api.skyspear.in;

        location / {
            proxy_pass http://trading_worker;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
            
            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
    }
}
```

## 📋 Alternative: Quick Setup via gcloud CLI

```bash
# Create health check
gcloud compute health-checks create http skyspear-health-check \
  --port=80 \
  --request-path=/health

# Create instance group
gcloud compute instance-groups unmanaged create skyspear-instance-group \
  --zone=asia-south1-b

# Add VM to instance group
gcloud compute instance-groups unmanaged add-instances skyspear-instance-group \
  --instances=skyspear-prod01 \
  --zone=asia-south1-b

# Create backend service
gcloud compute backend-services create skyspear-backend \
  --protocol=HTTP \
  --port-name=http \
  --health-checks=skyspear-health-check \
  --global

# Add instance group to backend
gcloud compute backend-services add-backend skyspear-backend \
  --instance-group=skyspear-instance-group \
  --instance-group-zone=asia-south1-b \
  --global

# Create SSL certificate
gcloud compute ssl-certificates create skyspear-ssl-cert \
  --domains=skyspear.in,www.skyspear.in,api.skyspear.in

# Create URL map
gcloud compute url-maps create skyspear-url-map \
  --default-service=skyspear-backend

# Create target HTTPS proxy
gcloud compute target-https-proxies create skyspear-https-proxy \
  --url-map=skyspear-url-map \
  --ssl-certificates=skyspear-ssl-cert

# Reserve global IP
gcloud compute addresses create skyspear-ip --global

# Get IP address
gcloud compute addresses describe skyspear-ip --global

# Create forwarding rule
gcloud compute forwarding-rules create skyspear-https-rule \
  --address=skyspear-ip \
  --target-https-proxy=skyspear-https-proxy \
  --ports=443 \
  --global
```

## ✅ Benefits

1. **No certificate management** - Google handles everything
2. **Automatic renewal** - Never expires
3. **Global CDN** - Better performance worldwide
4. **DDoS protection** - Built-in
5. **Monitoring** - Built-in metrics and logging

## 🎯 Next Steps

1. Set up Load Balancer (via Console or CLI above)
2. Update DNS to point to Load Balancer IP
3. Wait for SSL certificate to provision (15-60 min)
4. Remove certbot from docker-compose.yml
5. Simplify nginx.conf (HTTP only, no SSL)

This is much cleaner and more production-ready!

