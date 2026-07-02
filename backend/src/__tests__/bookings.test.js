require('dotenv').config({ path: '.env.test' })
const request = require('supertest')
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { clearDatabase, prisma } = require('../test-utils/setup')

jest.mock('../services/whatsappService')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', require('../routes/auth'))
app.use('/api/providers', require('../routes/providers'))
app.use('/api/bookings', require('../routes/bookings'))

let customerToken, providerToken, providerUserId, serviceId, providerId

beforeEach(async () => {
  await clearDatabase()

  // Register customer via API
  const customerRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'CUSTOMER',
      district: 'Colombo',
      phone: '+94771234567'
    })
  customerToken = customerRes.body.accessToken

  // Create provider user + provider record + service atomically
  const hashedPassword = await bcrypt.hash('password123', 12)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: 'Test Provider',
        email: 'provider@test.com',
        password: hashedPassword,
        role: 'PROVIDER',
        district: 'Colombo',
        phone: '+94779876543'
      }
    })

    const provider = await tx.provider.create({
      data: {
        userId: user.id,
        district: 'Colombo',
        verificationStatus: 'VERIFIED',
        nicVerified: true
      }
    })

    const service = await tx.service.create({
      data: {
        providerId: provider.id,
        category: 'Plumbing',
        title: 'Pipe Repair',
        description: 'Fix leaking pipes',
        basePrice: 2000
      }
    })

    return { userId: user.id, providerId: provider.id, serviceId: service.id }
  })

  providerUserId = result.userId
  providerId = result.providerId
  serviceId = result.serviceId

  // Login as provider to get token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'provider@test.com', password: 'password123' })
  providerToken = loginRes.body.accessToken
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Booking Endpoints', () => {
  describe('POST /api/bookings', () => {
    it('should create a booking successfully as a customer', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM',
          paymentMode: 'CASH',
          notes: 'Kitchen sink is leaking'
        })
         console.log('Booking create response:', JSON.stringify(res.body, null, 2))

      expect(res.statusCode).toBe(201)
      expect(res.body.booking.status).toBe('PENDING')
      expect(res.body.booking.serviceId).toBe(serviceId)
    })

    it('should reject booking without a token', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({ serviceId, bookingDate: '2026-12-01', timeSlot: '10:00 AM - 12:00 PM' })

      expect(res.statusCode).toBe(401)
    })

    it('should reject booking with missing required fields', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ serviceId })

      expect(res.statusCode).toBe(400)
    })

    it('should reject booking with a non-existent service ID', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId: '00000000-0000-0000-0000-000000000000',
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM'
        })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('GET /api/bookings/my-bookings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM',
          paymentMode: 'CASH'
        })
    })

    it('should return the customer\'s bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`)

      expect(res.statusCode).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(1)
      expect(res.body[0].status).toBe('PENDING')
    })

    it('should return empty array when customer has no bookings', async () => {
      const hashedPw = await bcrypt.hash('password123', 12)
      await prisma.user.create({
        data: {
          name: 'Fresh Customer',
          email: 'fresh@test.com',
          password: hashedPw,
          role: 'CUSTOMER',
          district: 'Kandy'
        }
      })

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'fresh@test.com', password: 'password123' })

      const res = await request(app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.length).toBe(0)
    })
  })

  describe('PATCH /api/bookings/:id/status', () => {
    let bookingId

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM',
          paymentMode: 'CASH'
        })
      bookingId = res.body.booking.id
    })

    it('should allow provider to confirm a booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'CONFIRMED' })

      expect(res.statusCode).toBe(200)
      expect(res.body.booking.status).toBe('CONFIRMED')
    })

    it('should not allow customer to update booking status', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CONFIRMED' })

      expect(res.statusCode).toBe(403)
    })

    it('should reject invalid status values', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'INVALID_STATUS' })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /api/bookings/:id/cancel', () => {
    let bookingId

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          bookingDate: '2026-12-01',
          timeSlot: '10:00 AM - 12:00 PM',
          paymentMode: 'CASH'
        })
      bookingId = res.body.booking.id
    })

    it('should allow customer to cancel their own booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.booking.status).toBe('CANCELLED')
    })

    it('should not allow provider to cancel a customer booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${providerToken}`)

      expect(res.statusCode).toBe(403)
    })
  })
})