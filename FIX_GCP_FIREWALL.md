# Fix GCP Firewall: AWS vs GCP Difference

## 🔍 The Problem

You're looking at **Firewall Policies** (Network-level) which show "Enforced: Off" - these are NOT active.

In GCP, you need **VPC Firewall Rules** (equivalent to AWS Security Groups).

## 📊 AWS vs GCP Comparison

### AWS (What You Had)
- **Security Groups**: Attached directly to instances
- Ports 80, 443, 22 open from `0.0.0.0/0`
- ✅ **This was working**

### GCP (Current Issue)
- **Firewall Policies**: Network-level, currently "Enforced: Off" (not active)
- **VPC Firewall Rules**: Instance-level (what you need)
- ❌ **Missing or not configured correctly**

## 🔧 Solution: Create VPC Firewall Rules

### Option 1: Via GCP Console (Recommended)

1. **Go to the correct place:**
   - Navigate to: **VPC Network → Firewall** (NOT "Firewall policies")
   - URL: `https://console.cloud.google.com/networking/firewalls`

2. **Create HTTP Rule:**
   - Click **"CREATE FIREWALL RULE"**
   - **Name**: `allow-http`
   - **Direction**: Ingress
   - **Action on match**: Allow
   - **Targets**: All instances in the network (or select your instance)
   - **Source IP ranges**: `0.0.0.0/0`
   - **Protocols and ports**: 
     - Check **TCP**
     - Enter **80**
   - Click **CREATE**

3. **Create HTTPS Rule:**
   - Click **"CREATE FIREWALL RULE"**
   - **Name**: `allow-https`
   - **Direction**: Ingress
   - **Action on match**: Allow
   - **Targets**: All instances in the network (or select your instance)
   - **Source IP ranges**: `0.0.0.0/0`
   - **Protocols and ports**: 
     - Check **TCP**
     - Enter **443**
   - Click **CREATE**

### Option 2: Via gcloud CLI

SSH into your GCP instance or use Cloud Shell:

```bash
# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Create HTTP rule
gcloud compute firewall-rules create allow-http \
  --project=$PROJECT_ID \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:80 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=http-server

# Create HTTPS rule
gcloud compute firewall-rules create allow-https \
  --project=$PROJECT_ID \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=https-server
```

### Option 3: Use Default Rules (If They Exist)

GCP sometimes creates default rules. Check if these exist:

```bash
gcloud compute firewall-rules list --filter="name~'default-allow-http' OR name~'default-allow-https'"
```

If they exist but aren't working, check:
1. They target the right network tags
2. Your instance has the matching network tags

## 🏷️ Network Tags (Important!)

If your firewall rules use **target tags** (like `http-server`, `https-server`), your VM instance needs those tags:

1. Go to: **Compute Engine → VM instances**
2. Click on your instance
3. Click **EDIT**
4. Under **Network tags**, add:
   - `http-server`
   - `https-server`
5. Click **SAVE**

Or via CLI:
```bash
gcloud compute instances add-tags YOUR_INSTANCE_NAME \
  --tags=http-server,https-server \
  --zone=YOUR_ZONE
```

## ✅ Verification

After creating rules, verify:

```bash
# List firewall rules
gcloud compute firewall-rules list

# Test from external machine
curl -I http://YOUR_SERVER_IP
curl -I https://api.skyspear.in/health
```

## 🎯 Quick Fix Summary

1. **Go to**: VPC Network → **Firewall** (not "Firewall policies")
2. **Create rules** for ports 80 and 443
3. **Add network tags** to your VM instance if rules use tags
4. **Wait 1-2 minutes** for rules to propagate
5. **Test**: `curl https://api.skyspear.in/health`

## 📝 Key Differences

| AWS | GCP |
|-----|-----|
| Security Groups | VPC Firewall Rules |
| Attached to instance | Network-level rules |
| Simple | Can use tags/filters |
| Always active | Need to be created |

The "Firewall policies" you saw are a newer feature (Cloud NGFW) and are separate from the basic VPC firewall rules that control instance access.

