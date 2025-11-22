#!/bin/bash
# Script to create GCP VPC Firewall Rules (equivalent to AWS Security Groups)
# Run this from your local machine with gcloud CLI installed, or from Cloud Shell

set -e

echo "=========================================="
echo "GCP Firewall Rules Setup"
echo "=========================================="
echo ""

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Please set it:"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "Project: $PROJECT_ID"
echo ""

# Check if rules already exist
echo "Checking existing firewall rules..."
EXISTING_HTTP=$(gcloud compute firewall-rules list --filter="name=allow-http" --format="value(name)" 2>/dev/null || echo "")
EXISTING_HTTPS=$(gcloud compute firewall-rules list --filter="name=allow-https" --format="value(name)" 2>/dev/null || echo "")

# Create HTTP rule if it doesn't exist
if [ -z "$EXISTING_HTTP" ]; then
    echo "Creating HTTP firewall rule (port 80)..."
    gcloud compute firewall-rules create allow-http \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:80 \
        --source-ranges=0.0.0.0/0 \
        --description="Allow HTTP traffic from anywhere"
    echo "✓ HTTP rule created"
else
    echo "✓ HTTP rule already exists: $EXISTING_HTTP"
fi

# Create HTTPS rule if it doesn't exist
if [ -z "$EXISTING_HTTPS" ]; then
    echo "Creating HTTPS firewall rule (port 443)..."
    gcloud compute firewall-rules create allow-https \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:443 \
        --source-ranges=0.0.0.0/0 \
        --description="Allow HTTPS traffic from anywhere"
    echo "✓ HTTPS rule created"
else
    echo "✓ HTTPS rule already exists: $EXISTING_HTTPS"
fi

echo ""
echo "=========================================="
echo "Firewall Rules Summary"
echo "=========================================="
echo ""
gcloud compute firewall-rules list --filter="name~'allow-http' OR name~'allow-https'"
echo ""
echo "✅ Firewall rules configured!"
echo ""
echo "Note: These rules apply to ALL instances in the 'default' network."
echo "If you want to restrict to specific instances, use network tags."
echo ""
echo "To verify from external machine:"
echo "  curl -I http://YOUR_SERVER_IP"
echo "  curl -I https://api.skyspear.in/health"

