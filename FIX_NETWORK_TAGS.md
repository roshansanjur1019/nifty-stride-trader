# Fix: Firewall Rules Use Network Tags

## 🔍 The Problem

Your firewall rules exist (`skyspear-allow-http`, `skyspear-allow-https`) but they show **"Target: Tags..."** which means they only apply to VM instances that have specific network tags.

If your VM instance doesn't have the matching tags, the firewall rules won't apply!

## ✅ Solution: Add Network Tags to Your VM

### Step 1: Check What Tags Your Rules Require

1. Go to: **VPC Network → Firewall**
2. Click on `skyspear-allow-http` rule
3. Look at the **"Target"** section - it will show the required tags (e.g., `http-server`)
4. Do the same for `skyspear-allow-https` (e.g., `https-server`)

### Step 2: Add Tags to Your VM Instance

**Via GCP Console:**
1. Go to: **Compute Engine → VM instances**
2. Click on your VM instance
3. Click **EDIT** (top of page)
4. Scroll to **Network interfaces** section
5. Click **"Edit"** on the network interface
6. Under **Network tags**, add the required tags:
   - `http-server` (for HTTP rule)
   - `https-server` (for HTTPS rule)
7. Click **DONE** then **SAVE**

**Via gcloud CLI:**
```bash
# List your instances to get the name
gcloud compute instances list

# Add tags (replace INSTANCE_NAME and ZONE)
gcloud compute instances add-tags INSTANCE_NAME \
  --zone=ZONE \
  --tags=http-server,https-server
```

### Step 3: Alternative - Modify Rules to Apply to All Instances

If you want the rules to apply to ALL instances (like AWS Security Groups), modify the rules:

1. Go to: **VPC Network → Firewall**
2. Click on `skyspear-allow-http`
3. Click **EDIT**
4. Under **Targets**, change from **"Specified target tags"** to **"All instances in the network"**
5. Click **SAVE**
6. Repeat for `skyspear-allow-https`

## 🔧 Quick Fix Script

I've created `check-vm-tags.sh` that will:
1. Check your VM instance's current tags
2. Identify missing tags
3. Add them automatically

Run it:
```bash
bash check-vm-tags.sh YOUR_INSTANCE_NAME
```

## 🎯 Most Likely Fix

The rules probably require tags like:
- `http-server` 
- `https-server`

Add these to your VM instance, and the firewall rules will apply!

## 📋 Verification

After adding tags:
1. Wait 1-2 minutes
2. Test: `curl https://api.skyspear.in/health`
3. Should work now!

