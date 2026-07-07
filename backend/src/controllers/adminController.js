const prisma = require('../utils/prismaClient')

// GET platform stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalProviders, totalBookings, pendingProviders, completedBookings] =
      await Promise.all([
        prisma.user.count(),
        prisma.provider.count(),
        prisma.booking.count(),
        prisma.provider.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } })
      ])

    const revenueResult = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true }
    })

    res.json({
      totalUsers,
      totalProviders,
      totalBookings,
      pendingProviders,
      completedBookings,
      totalRevenue: revenueResult._sum.totalAmount || 0
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
    const { verificationStatus } = req.body

    const validStatuses = ['VERIFIED', 'REJECTED', 'PENDING']
    if (!validStatuses.includes(verificationStatus)) {
      return res.status(400).json({ error: 'Invalid verification status' })
    }

    const provider = await prisma.provider.update({
      where: { id },
      data: {
        verificationStatus,
        nicVerified: verificationStatus === 'VERIFIED'
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
    const bookings = await prisma.booking.findMany({
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