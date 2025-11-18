const express = require('express')
const bodyParser = require('body-parser')

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

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`trading-worker listening on http://0.0.0.0:${port}`)
})