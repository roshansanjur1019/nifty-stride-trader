# AngelOne SmartAPI IP Configuration with Load Balancer

## 🔍 Understanding the Setup

### Current Architecture:
```
Users → Load Balancer (34.149.218.63) → VM (34.180.17.77) → Trading Worker
                                                              ↓
                                                    AngelOne API Calls
```

### Key Point:
- **Load Balancer IP (34.149.218.63)**: For user traffic (web requests)
- **VM Static IP (34.180.17.77)**: For AngelOne API calls (outbound from trading-worker)

## ✅ What IP to Use in AngelOne SmartAPI

**Use the VM Static IP: `34.180.17.77`**

**Why?**
- The trading-worker container runs **on the VM**
- When it makes API calls to AngelOne, the **source IP is the VM's IP** (34.180.17.77)
- AngelOne sees this IP and checks it against the whitelist
- The load balancer IP (34.149.218.63) is only for incoming user traffic

## 📋 AngelOne SmartAPI Configuration

### Update in SmartAPI Dashboard:

1. **Primary Static IP**: `34.180.17.77` ✅ (Keep this - it's correct)
2. **Secondary Static IP**: Leave blank or add load balancer IP if needed
3. **Redirect URL**: `https://skyspear.in/smartapi/callback`
4. **Postback URL**: `https://skyspear.in/smartapi/callback`

### Why Keep VM IP?

- **Outbound API calls** from trading-worker use VM's IP
- **Inbound callbacks** from AngelOne can go through load balancer (via domain)
- AngelOne validates the **source IP** of API requests, which is the VM IP

## 🔧 Can You Use Load Balancer IP Instead?

**Option 1: Keep VM IP (Recommended)**
- ✅ Simple - no changes needed
- ✅ Works immediately
- ✅ VM IP is static and won't change

**Option 2: Use Load Balancer IP (Complex)**
- Would require:
  - NAT Gateway or Cloud NAT to route outbound traffic through load balancer
  - Complex networking setup
  - Not recommended for this use case

## ✅ Current Configuration is Correct

Your current setup:
- **VM Static IP**: `34.180.17.77` → Used for AngelOne API calls ✅
- **Load Balancer IP**: `34.149.218.63` → Used for user web traffic ✅
- **AngelOne Primary IP**: `34.180.17.77` → Correct! ✅

## 🎯 Summary

**Don't change anything in AngelOne SmartAPI!**

- Keep **Primary Static IP** as `34.180.17.77` (VM IP)
- This is the IP that makes outbound API calls to AngelOne
- Load balancer is only for incoming user traffic
- Both can coexist - they serve different purposes

## 📝 How It Works

1. **User visits** `https://skyspear.in` → Goes through Load Balancer (34.149.218.63)
2. **Load Balancer** → Routes to VM (34.180.17.77) → Nginx → Frontend/Trading Worker
3. **Trading Worker** makes API call to AngelOne → Source IP is VM (34.180.17.77)
4. **AngelOne** checks whitelist → Sees 34.180.17.77 → Allows request ✅
5. **AngelOne callback** → Goes to `https://skyspear.in/smartapi/callback` → Load Balancer → VM

Both IPs work together:
- **Load Balancer IP**: For users (HTTPS, SSL, global routing)
- **VM IP**: For AngelOne API calls (outbound requests)

