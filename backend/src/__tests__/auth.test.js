require('dotenv').config({ path: '.env.test' })
const request = require('supertest')
const express = require('express')
const cors = require('cors')
const { clearDatabase, prisma } = require('../test-utils/setup')

jest.mock('../services/whatsappService')

// Build a minimal version of your app just for testing (avoids port conflicts)
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/auth', require('../routes/auth'))

beforeEach(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new customer successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Customer',
          email: 'testcustomer@example.com',
          password: 'password123',
          role: 'CUSTOMER',
          district: 'Colombo'
        })

      expect(res.statusCode).toBe(201)
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body.user.email).toBe('testcustomer@example.com')
    })

    it('should reject registration with a duplicate email', async () => {
      // First registration
      await request(app).post('/api/auth/register').send({
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'CUSTOMER',
        district: 'Colombo'
      })

      // Second registration attempt with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          password: 'password456',
          role: 'CUSTOMER',
          district: 'Gampaha'
        })

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/already registered/i)
    })

    it('should reject registration with an invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'password123',
          role: 'CUSTOMER'
        })

      expect(res.statusCode).toBe(400)
    })

    it('should reject a password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'shortpass@example.com',
          password: '123',
          role: 'CUSTOMER'
        })

      expect(res.statusCode).toBe(400)
    })

    it('should create a Provider profile when registering with role PROVIDER', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Provider',
          email: 'testprovider@example.com',
          password: 'password123',
          role: 'PROVIDER',
          district: 'Kandy'
        })

      expect(res.statusCode).toBe(201)

      const provider = await prisma.provider.findUnique({
        where: { userId: res.body.user.id }
      })
      expect(provider).not.toBeNull()
      expect(provider.district).toBe('Kandy')
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Login Test User',
        email: 'logintest@example.com',
        password: 'correctpassword',
        role: 'CUSTOMER',
        district: 'Colombo'
      })
    })

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logintest@example.com', password: 'correctpassword' })

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('accessToken')
    })

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'logintest@example.com', password: 'wrongpassword' })

      expect(res.statusCode).toBe(401)
    })

    it('should reject login for a non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'doesnotexist@example.com', password: 'whatever' })

      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return user data with a valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send({
        name: 'Me Test User',
        email: 'metest@example.com',
        password: 'password123',
        role: 'CUSTOMER',
        district: 'Galle'
      })

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerRes.body.accessToken}`)

      expect(res.statusCode).toBe(200)
      expect(res.body.email).toBe('metest@example.com')
    })

    it('should reject requests with no token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.statusCode).toBe(401)
    })

    it('should reject requests with an invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')

      expect(res.statusCode).toBe(401)
    })
  })
})