const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { validationResult } = require('express-validator')

const prisma = require('../utils/prismaClient')

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

// REGISTER
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, phone, role, district, address } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, phone, role, district, address }
    })

    // If registering as provider, create provider profile too
    if (role === 'PROVIDER') {
      await prisma.provider.create({
        data: { userId: user.id, district: district || '' }
      })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    res.status(201).json({
      message: 'Account created successfully',
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        district: user.district,
        address: user.address,
        createdAt: user.createdAt 
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message })
  }
}

// LOGIN
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        district: user.district,
        address: user.address,
        createdAt: user.createdAt 
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message })
  }
}

// GET CURRENT USER (protected)
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, district: true, address: true, createdAt: true }
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch user' })
  }
}

// UPDATE CURRENT USER PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, phone, district, address } = req.body

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, phone, district, address },
      select: { id: true, name: true, email: true, role: true, phone: true, district: true, address: true, createdAt: true }
    })

    res.json({ message: 'Profile updated successfully', user: updatedUser })
  } catch (error) {
    res.status(500).json({ error: 'Could not update profile', details: error.message })
  }
}

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { oldPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Incorrect old password' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword }
    })

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Could not change password', details: error.message })
  }
}