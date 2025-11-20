# Migration to Official SmartAPI JavaScript SDK

## 🎯 Why Use the Official SDK?

1. **Simplified Code**: No manual API calls, headers, or token management
2. **Built-in Authentication**: Handles `loginByPassword` (recommended by Angel One)
3. **Automatic Token Refresh**: SDK manages session expiry
4. **WebSocket Support**: Built-in WebSocket for order updates
5. **Error Handling**: Better error messages and handling
6. **Maintained**: Official SDK maintained by Angel One team

## 📦 Installation

```bash
npm install smartapi-javascript base32
```

## 🔄 Migration Steps

### **Before (Manual Implementation):**
```javascript
// Manual fetch calls
const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/...', {
  method: 'POST',
  headers: {
    'X-ClientPublicIP': publicIp,
    'X-ClientLocalIP': localIp,
    // ... many headers
  },
  body: JSON.stringify({...})
})
```

### **After (Using SDK):**
```javascript
const { createAuthenticatedClient } = require('./angelOneSDK')

// Simple authentication
const auth = await createAuthenticatedClient({
  apiKey: userCredentials.apiKey,
  clientId: userCredentials.clientId,
  password: userCredentials.password, // SDK uses loginByPassword
  totpSecret: userCredentials.totpSecret
})

// Use the client
const marketData = await getMarketData(auth.client, {
  mode: 'LTP',
  exchangeTokens: { NSE: ['99926000'] }
})
```

## 🔑 Key Changes

### **1. Authentication Method**
- **Old**: `loginByMpin` (manual implementation)
- **New**: `loginByPassword` (via SDK's `generateSession`)
- **Benefit**: Angel One recommends `loginByPassword` (as per forum response)

### **2. Token Management**
- **Old**: Manual token storage and refresh
- **New**: SDK handles tokens automatically
- **Benefit**: Automatic session refresh, no manual token management

### **3. API Calls**
- **Old**: Manual `fetch` calls with all headers
- **New**: Simple SDK methods
- **Benefit**: Cleaner code, less error-prone

### **4. WebSocket**
- **Old**: Manual WebSocket implementation
- **New**: SDK's built-in WebSocket classes
- **Benefit**: Easier order monitoring

## 📝 Updated Code Structure

### **Authentication:**
```javascript
const { createAuthenticatedClient } = require('./angelOneSDK')

// Get user credentials from database
const userCredentials = await getUserBrokerCredentials(userId, 'angel_one')

// Authenticate using SDK
const auth = await createAuthenticatedClient({
  apiKey: userCredentials.apiKey,
  clientId: userCredentials.clientId,
  password: userCredentials.password, // Use password, not MPIN
  totpSecret: userCredentials.totpSecret
})

if (!auth.success) {
  throw new Error(auth.error)
}

// Use auth.client for all API calls
const smartApi = auth.client
```

### **Market Data:**
```javascript
const { getMarketData } = require('./angelOneSDK')

const result = await getMarketData(smartApi, {
  mode: 'LTP',
  exchangeTokens: {
    NSE: ['99926000', '99926017'] // NIFTY and VIX
  }
})
```

### **Order Placement:**
```javascript
const { placeOrder } = require('./angelOneSDK')

const orderResult = await placeOrder(smartApi, {
  variety: 'NORMAL',
  tradingsymbol: 'NIFTY25JAN25000CE',
  symboltoken: '58662',
  transactiontype: 'SELL',
  exchange: 'NFO',
  ordertype: 'LIMIT',
  producttype: 'MIS',
  duration: 'DAY',
  price: '150.00',
  quantity: '75'
})
```

### **Funds:**
```javascript
const { getBrokerFunds } = require('./angelOneSDK')

const funds = await getBrokerFunds(smartApi)
console.log('Available funds:', funds.availableFunds)
```

## ⚠️ Important Notes

### **Password vs MPIN:**
- SDK uses `loginByPassword` (recommended by Angel One)
- You may need to store user's **password** instead of just MPIN
- Or use password for authentication if available

### **IP Whitelisting:**
- Still required for Angel One
- SDK handles IP headers automatically
- Users still need to whitelist your server IP

### **Multi-Tenant:**
- Each user gets their own SDK client instance
- Credentials fetched from database per user
- All requests still go through your server IP

## 🚀 Benefits

1. **Less Code**: ~70% reduction in API-related code
2. **Better Error Handling**: SDK provides clear error messages
3. **Automatic Updates**: SDK updates handle API changes
4. **Official Support**: Maintained by Angel One team
5. **Documentation**: Well-documented with examples

## 📚 References

- [SmartAPI JavaScript SDK](https://github.com/angel-one/smartapi-javascript)
- [SmartAPI Python SDK](https://github.com/angel-one/smartapi-python)
- [Angel One SmartAPI Docs](https://smartapi.angelbroking.com/docs)

---

**Next Steps:**
1. Update `index.js` to use SDK wrapper
2. Test authentication with real credentials
3. Migrate all API calls to SDK methods
4. Update WebSocket to use SDK's WebSocket classes

