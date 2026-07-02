const prisma = require('../utils/prismaClient')

// GET all providers (with optional filters)
exports.getProviders = async (req, res) => {
  try {
    const { district, category } = req.query

    const providers = await prisma.provider.findMany({
      where: {
        ...(district && { district }),
        verificationStatus: 'VERIFIED',
        ...(category && {
          services: { some: { category } }
        })
      },
      include: {
        user: { select: { name: true, phone: true } },
        services: true,
        reviews: { select: { rating: true } }
      }
    })

    // Calculate average rating for each provider
    const providersWithRating = providers.map(provider => {
      const ratings = provider.reviews.map(r => r.rating)
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null
      return { ...provider, avgRating, reviewCount: ratings.length }
    })

    res.json(providersWithRating)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch providers', details: error.message })
  }
}

// GET single provider profile
exports.getProviderById = async (req, res) => {
  try {
    const { id } = req.params

    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        services: true,
        reviews: {
          include: { customer: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' })
    }

    res.json(provider)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch provider', details: error.message })
  }
}

// UPDATE provider profile (protected - only the provider themselves)
exports.updateProvider = async (req, res) => {
  try {
    const { bio, district, hourlyRate, nicNumber } = req.body

    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' })
    }

    const updated = await prisma.provider.update({
      where: { userId: req.user.userId },
      data: { bio, district, hourlyRate, nicNumber }
    })

    res.json({ message: 'Profile updated', provider: updated })
  } catch (error) {
    res.status(500).json({ error: 'Update failed', details: error.message })
  }
}

// ADD a service (protected - provider only)
exports.addService = async (req, res) => {
  try {
    const { category, title, description, basePrice } = req.body

    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'You must have a provider profile to add services' })
    }

    const service = await prisma.service.create({
      data: {
        providerId: provider.id,
        category,
        title,
        description,
        basePrice: parseFloat(basePrice)
      }
    })

    res.status(201).json({ message: 'Service added', service })
  } catch (error) {
    res.status(500).json({ error: 'Could not add service', details: error.message })
  }
}