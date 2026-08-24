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
      where: { role: 'CUSTOMER' },
      select: {
        id: true, name: true, email: true, role: true,
        district: true, phone: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch users', details: error.message })
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