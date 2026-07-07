const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()
app.use((req, res, next) => {
  console.log(`📥 Incoming request: ${req.method} ${req.url}`)
  next()
})
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting — max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
})
app.use(limiter)

// Parse incoming JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check — visit http://localhost:5000/api/health to confirm server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'LocalLink API is running!', timestamp: new Date() })
})

// Routes (we'll add these soon)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/providers', require('./routes/providers'))
app.use('/api/bookings', require('./routes/bookings'))
app.use('/api/reviews', require('./routes/reviews'))
app.use('/api/upload', require('./routes/upload'))
app.use('/api/admin', require('./routes/admin'))

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong on the server.'
  })
})

app.listen(PORT, () => {
  console.log(`✅ LocalLink server running on http://localhost:${PORT}`)
})