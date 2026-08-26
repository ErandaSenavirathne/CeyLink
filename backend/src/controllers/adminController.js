const prisma = require('../utils/prismaClient')

// GET platform stats
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    const [totalUsers, totalProviders, totalBookings, pendingProviders, completedBookings] =
      await Promise.all([
        prisma.user.count({ where: dateFilter }),
        prisma.provider.count({ where: dateFilter }),
        prisma.booking.count({ where: dateFilter }),
        prisma.provider.count({ where: { ...dateFilter, verificationStatus: 'PENDING' } }),
        prisma.booking.count({ where: { ...dateFilter, status: 'COMPLETED' } })
      ])

    const revenueResult = await prisma.booking.aggregate({
      where: { ...dateFilter, status: 'COMPLETED' },
      _sum: { totalAmount: true }
    })

    let trendStart = new Date()
    trendStart.setDate(trendStart.getDate() - 29)
    let trendEnd = new Date()

    if (startDate) trendStart = new Date(startDate)
    if (endDate) trendEnd = new Date(endDate)

    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: trendStart, lte: trendEnd } },
      select: { createdAt: true, status: true, totalAmount: true }
    })

    const trendsMap = {}
    
    // Create map for each day in range (capped at 90 days)
    const diffTime = Math.abs(trendEnd - trendStart);
    const diffDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 90); 

    for(let i = diffDays; i >= 0; i--) {
      const d = new Date(trendEnd)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (!trendsMap[dateStr]) {
        trendsMap[dateStr] = { date: dateStr, revenue: 0, bookings: 0 }
      }
    }

    recentBookings.forEach(b => {
      const dateStr = b.createdAt.toISOString().split('T')[0]
      if (trendsMap[dateStr]) {
        trendsMap[dateStr].bookings += 1
        if (b.status === 'COMPLETED' && b.totalAmount) {
          trendsMap[dateStr].revenue += b.totalAmount
        }
      }
    })
    const trends = Object.values(trendsMap)

    // User Roles distribution
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })
    const userDistribution = usersByRole.map(r => ({ name: r.role, value: r._count.id }))

    res.json({
      totalUsers,
      totalProviders,
      totalBookings,
      pendingProviders,
      completedBookings,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      trends,
      userDistribution
    })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch stats', details: error.message })
  }
}

// GET all providers with their verification status
exports.getProviders = async (req, res) => {
  try {
    const providers = await prisma.provider.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true, createdAt: true } },
        services: true,
        _count: { select: { bookings: true, reviews: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(providers)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch providers', details: error.message })
  }
}

// UPDATE provider verification status
exports.updateProviderVerification = async (req, res) => {
  try {
    const { id } = req.params
    const { verificationStatus, rejectionReason } = req.body

    const validStatuses = ['VERIFIED', 'REJECTED', 'PENDING']
    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' })
    }

    if (verificationStatus === 'REJECTED' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: {
        verificationStatus,
        nicVerified: verificationStatus === 'VERIFIED',
        rejectionReason: verificationStatus === 'REJECTED' ? rejectionReason : null
      },
      include: { user: { select: { name: true, email: true } } }
    })

    res.json({ message: `Provider ${verificationStatus.toLowerCase()}`, provider })
  } catch (error) {
    res.status(500).json({ error: 'Could not update provider', details: error.message })
  }
}

// GET all users
exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true,
        district: true, phone: true, isActive: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch users', details: error.message })
  }
}

// CREATE new user (Admin)
const bcrypt = require('bcryptjs')
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    })

    if (role === 'PROVIDER') {
      await prisma.provider.create({
        data: { userId: user.id, district: '' }
      })
    }

    res.status(201).json({ message: 'User created successfully', user: { id: user.id, name, email, role, isActive: true } })
  } catch (error) {
    res.status(500).json({ error: 'Could not create user', details: error.message })
  }
}

// UPDATE user (Admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, isActive } = req.body

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' })
    }

    // Check email uniqueness if email is changed
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (email !== existingUser.email) {
      const emailCheck = await prisma.user.findUnique({ where: { email } })
      if (emailCheck) {
        return res.status(400).json({ error: 'Email already in use by another account' })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, role, isActive },
      select: { id: true, name: true, email: true, role: true, district: true, phone: true, isActive: true, createdAt: true }
    })

    // Create provider profile if role changed to PROVIDER and doesn't exist
    if (role === 'PROVIDER' && existingUser.role !== 'PROVIDER') {
      const existingProvider = await prisma.provider.findUnique({ where: { userId: id } })
      if (!existingProvider) {
        await prisma.provider.create({ data: { userId: id, district: '' } })
      }
    }

    res.json({ message: 'User updated successfully', user: updatedUser })
  } catch (error) {
    res.status(500).json({ error: 'Could not update user', details: error.message })
  }
}

// GET all bookings
exports.getBookings = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }

    const bookings = await prisma.booking.findMany({
      where: dateFilter,
      include: {
        customer: { select: { name: true, email: true } },
        provider: { include: { user: { select: { name: true } } } },
        service: { select: { title: true, category: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch bookings', details: error.message })
  }
}

// GET pending services
exports.getPendingServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { status: 'PENDING' },
      include: {
        provider: {
          include: { user: { select: { name: true, email: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json(services)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch pending services', details: error.message })
  }
}

// REVIEW a service
exports.reviewService = async (req, res) => {
  try {
    const { id } = req.params
    const { action, rejectionReason } = req.body

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Invalid action' })
    }

    if (action === 'REJECT' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ error: 'Rejection reason is required' })
    }

    const data = {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      rejectionReason: action === 'APPROVE' ? null : rejectionReason
    }

    const service = await prisma.service.update({
      where: { id },
      data
    })

    res.json({ message: `Service ${data.status.toLowerCase()}`, service })
  } catch (error) {
    res.status(500).json({ error: 'Could not review service', details: error.message })
  }
}

// GET all categories (including deactivated) for admin
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' }
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch categories', details: error.message })
  }
}

// CREATE new category
exports.createCategory = async (req, res) => {
  try {
    const { icon, nameEn, nameSi, nameTa } = req.body
    
    if (!icon || !nameEn || !nameSi || !nameTa) {
      return res.status(400).json({ error: 'Icon and names in all 3 languages are required' })
    }

    const category = await prisma.category.create({
      data: { icon, nameEn, nameSi, nameTa }
    })

    res.status(201).json({ message: 'Category created successfully', category })
  } catch (error) {
    res.status(500).json({ error: 'Could not create category', details: error.message })
  }
}

// UPDATE category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { icon, nameEn, nameSi, nameTa, isActive } = req.body

    const category = await prisma.category.update({
      where: { id },
      data: { icon, nameEn, nameSi, nameTa, isActive }
    })

    res.json({ message: 'Category updated successfully', category })
  } catch (error) {
    res.status(500).json({ error: 'Could not update category', details: error.message })
  }
}

// DELETE category (Soft delete / Deactivate)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false }
    })
    res.json({ message: 'Category deactivated successfully', category })
  } catch (error) {
    res.status(500).json({ error: 'Could not deactivate category', details: error.message })
  }
}