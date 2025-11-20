# Multi-Tenant Broker Integration Architecture

## 🔑 The Solution: How Users Connect Their Own Broker Accounts

### **Key Concept: Server IP Whitelisting**

**For Angel One:**
- All users' API requests go through **YOUR EC2 server** (same IP: `98.88.173.81`)
- Each user must whitelist **YOUR server IP** in their Angel One SmartAPI dashboard
- The application uses **their credentials** but makes requests from **your whitelisted IP**

**For Zerodha:**
- Uses OAuth authentication
- No IP whitelisting needed
- Users authorize via OAuth flow

## 📊 Architecture Flow

```
User 1 (Angel One)
  ↓
  Adds their API Key + Secret
  ↓
  Stored encrypted in database
  ↓
  When executing trade:
    ↓
    Fetch user's credentials from DB
    ↓
    Decrypt credentials
    ↓
    Use their API Key + Client ID + MPIN
    ↓
    Make request from EC2 server (IP: 98.88.173.81)
    ↓
    Angel One checks: Is IP whitelisted? ✅ (user whitelisted it)
    ↓
    Trade executes ✅
```

## 🔧 Implementation Requirements

### 1. **User Credential Storage** ✅ (Already Done)
- Credentials stored encrypted in `broker_accounts` table
- Each user has their own `api_key_encrypted`, `api_secret_encrypted`
- Need to also store: `client_id`, `mpin`, `totp_secret` per user

### 2. **Credential Decryption** ⚠️ (Needs Implementation)
- Backend needs to decrypt user credentials
- Use same encryption key as Supabase function

### 3. **User-Specific API Calls** ⚠️ (Needs Update)
- Currently uses `process.env.ANGEL_ONE_*` (single credentials)
- Need to fetch user's credentials from DB
- Use their credentials for their trades

### 4. **IP Whitelisting Instructions** ⚠️ (Needs UI Update)
- Show clear instructions in UI
- Guide users to whitelist server IP
- Verify IP whitelisting before allowing connection

## 📝 User Flow

### **Step 1: User Gets API Credentials**
1. User logs into Angel One SmartAPI dashboard
2. Creates API app
3. Gets: API Key, API Secret, Client ID
4. Sets MPIN and TOTP secret

### **Step 2: User Whitelists Server IP**
1. In SmartAPI dashboard, adds IP: `98.88.173.81`
2. Saves configuration

### **Step 3: User Adds Credentials to Your App**
1. User goes to Broker Integration page
2. Selects "Angel One"
3. Enters their API Key, API Secret, Client ID, MPIN, TOTP Secret
4. App validates connection
5. Credentials stored encrypted

### **Step 4: Trade Execution**
1. Scheduler triggers at 3:10 PM
2. For each user with auto-execute enabled:
   - Fetch their credentials from DB
   - Decrypt credentials
   - Use their API Key/Client ID/MPIN
   - Make request from EC2 server (whitelisted IP)
   - Trade executes successfully

## ⚠️ Current Issue

The trading worker currently uses:
```javascript
const apiKey = process.env.ANGEL_ONE_API_KEY  // ❌ Single credentials for all users
```

**Needs to be:**
```javascript
// Fetch user's credentials from database
const { data: brokerAccount } = await supabase
  .from('broker_accounts')
  .select('*')
  .eq('user_id', userId)
  .single()

// Decrypt credentials
const apiKey = decryptCredential(brokerAccount.api_key_encrypted)
const clientId = decryptCredential(brokerAccount.client_id_encrypted)
// ... etc
```

## ✅ Solution Steps

1. **Extend broker_accounts table** to store all Angel One fields:
   - `client_id_encrypted`
   - `mpin_encrypted`
   - `totp_secret_encrypted`
   - `public_ip` (for reference, but all use same server IP)

2. **Add decryption function** to trading worker

3. **Update execution functions** to use user-specific credentials

4. **Update UI** to:
   - Collect all required fields (Client ID, MPIN, TOTP Secret)
   - Show IP whitelisting instructions
   - Verify connection before saving

5. **Add IP verification** endpoint to test if user's IP is whitelisted

## 🎯 Why This Works

- **Single Server IP**: All users' requests come from same IP (your EC2)
- **User Credentials**: Each user uses their own API keys
- **IP Whitelisting**: Users whitelist your server IP in their SmartAPI dashboard
- **Result**: Seamless multi-tenant operation

This is exactly how AlgoTest works - they have a server, users whitelist that server IP, and use their own credentials!

