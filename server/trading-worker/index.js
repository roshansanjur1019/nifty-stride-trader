const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const fetch = require('node-fetch')

const app = express()
app.use(bodyParser.json())

// Simple health
app.get('/health', (req, res) => {
  res.json({ ok: true })
})

// Precheck endpoint for Short Strangle
app.post('/precheck', (req, res) => {
  const { userId, strategy = 'Short Strangle', capital } = req.body || {}
  const availableFunds = Number(process.env.AVAILABLE_FUNDS || 0)
  const totalCapital = typeof capital === 'number' ? capital : Number(process.env.TOTAL_CAPITAL || 500000)
  const vix = Number(process.env.VIX || 15)

  // Conservative allocation defaults
  const sellAllocPct = Number(process.env.SELL_ALLOC_PCT || 0.4) // 40%
  const requiredCapitalPerLot = Math.round(totalCapital * sellAllocPct)
  const eligible = availableFunds >= requiredCapitalPerLot

  const response = {
    strategy,
    vix,
    totalCapital,
    requiredCapitalPerLot,
    availableFunds,
    eligible,
    reason: eligible ? undefined : 'Insufficient funds for 1 lot short strangle',
  }
  res.json(response)
})

// ---- Angel One integration (proxy for frontend) ----

// Base32 decode (RFC 4648) – copied from Supabase function logic
function base32ToBytes (base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = (base32 || '').replace(/=+$/, '').replace(/\s+/g, '').toUpperCase()
  let bits = ''
  for (const c of cleaned) {
    const val = alphabet.indexOf(c)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

// Generate TOTP code (30s window, 6 digits)
function generateTOTP (secret) {
  const epoch = Math.floor(Date.now() / 1000)
  const counter = Math.floor(epoch / 30)

  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter), 0)

  const keyBytes = base32ToBytes(secret)
  const hmac = crypto.createHmac('sha1', keyBytes)
  hmac.update(buffer)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0xf
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  return String(code % 1000000).padStart(6, '0')
}

async function authenticateAngelOne ({
  apiKey,
  clientId,
  mpin,
  totpSecret,
  publicIp,
  localIp,
  macAddress,
}) {
  try {
    console.log('=== Angel One Authentication Attempt (AWS backend) ===')
    console.log('Public IP header:', publicIp)
    console.log('Local IP header:', localIp)
    console.log('MAC Address header:', macAddress)
    console.log('Client ID:', clientId)

    const totp = generateTOTP(totpSecret)
    console.log('Generated TOTP:', totp)

    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByMpin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': localIp,
        'X-ClientPublicIP': publicIp,
        'X-MACAddress': macAddress,
        'X-PrivateKey': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        clientcode: clientId,
        mpin,
        totp,
      }),
    })

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON auth response from Angel One:', text.substring(0, 400))
      return { success: false, error: `Non-JSON response from Angel One auth. Status: ${response.status}` }
    }

    const data = await response.json()
    console.log('Angel One auth response:', data)

    if (data?.status && data?.data?.jwtToken) {
      return { success: true, token: data.data.jwtToken, feedToken: data.data.feedToken }
    }

    return { success: false, error: data?.message || 'Authentication failed' }
  } catch (err) {
    console.error('Angel One authentication error:', err)
    return { success: false, error: err.message || 'Unknown error' }
  }
}

async function fetchMarketData ({
  token,
  apiKey,
  clientId,
  publicIp,
  localIp,
  macAddress,
  mode,
  exchangeTokens,
}) {
  try {
    const resolvedMode = mode || 'LTP'
    const resolvedExchangeTokens =
      exchangeTokens || { NSE: ['99926000', '99926009', '99926037', '99926017'], BSE: ['99919000'] }

    const response = await fetch(
      'https://apiconnect.angelbroking.com/rest/secure/angelbroking/market/v1/quote/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': localIp,
          'X-ClientPublicIP': publicIp,
          'X-MACAddress': macAddress,
          'X-PrivateKey': apiKey,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ mode: resolvedMode, exchangeTokens: resolvedExchangeTokens }),
      }
    )

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON market data response from Angel One:', text.substring(0, 400))
      return { status: false, message: 'Non-JSON response', raw: text }
    }

    const data = await response.json()
    console.log('Angel One market data response:', data)
    return data
  } catch (err) {
    console.error('Error fetching market data from Angel One:', err)
    throw err
  }
}

// Root POST – used by frontend via VITE_BACKEND_URL
app.post('/', async (req, res) => {
  const { action, mode, exchangeTokens } = req.body || {}

  if (!action) {
    return res.status(400).json({ success: false, error: 'Missing action in request body' })
  }

  if (action === 'fetchMarketData') {
    const apiKey = process.env.ANGEL_ONE_API_KEY
    const apiSecret = process.env.ANGEL_ONE_API_SECRET // currently unused but kept for parity
    const clientId = process.env.ANGEL_ONE_CLIENT_ID
    const mpin = process.env.ANGEL_ONE_PASSWORD
    const totpSecret = process.env.ANGEL_ONE_TOTP_SECRET

    if (!apiKey || !apiSecret || !clientId || !mpin || !totpSecret) {
      return res.status(500).json({ success: false, error: 'Missing Angel One credentials on backend' })
    }

    // Use whitelisted IP/MAC if provided; otherwise fall back to placeholders
    const publicIp = process.env.ANGEL_ONE_PUBLIC_IP || req.ip || '127.0.0.1'
    const localIp = process.env.ANGEL_ONE_LOCAL_IP || '127.0.0.1'
    const macAddress = process.env.ANGEL_ONE_MAC_ADDRESS || 'fe:ed:fa:ce:be:ef'

    const auth = await authenticateAngelOne({
      apiKey,
      clientId,
      mpin,
      totpSecret,
      publicIp,
      localIp,
      macAddress,
    })

    if (!auth.success || !auth.token) {
      return res.status(401).json({ success: false, error: auth.error || 'Authentication failed' })
    }

    try {
      const marketData = await fetchMarketData({
        token: auth.token,
        apiKey,
        clientId,
        publicIp,
        localIp,
        macAddress,
        mode,
        exchangeTokens,
      })
      return res.json({ success: true, data: marketData })
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch market data from Angel One',
      })
    }
  }

  return res.status(400).json({ success: false, error: 'Invalid action' })
})

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`trading-worker listening on http://0.0.0.0:${port}`)
})