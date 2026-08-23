const prisma = require('../utils/prismaClient')
const cloudinary = require('../utils/cloudinary')

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
        user: { select: { name: true, phone: true, createdAt: true } },
        services: true,
        reviews: { select: { rating: true } },
        _count: {
          select: {
            reviews: true,
            bookings: true
          }
        },
        bookings: {
          select: { id: true, status: true }
        }
      }
    })

    const providersWithStats = providers.map(provider => {
      const ratings = provider.reviews.map(r => r.rating)
      const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null
      const completedJobs = provider.bookings.filter(
        b => b.status === 'COMPLETED'
      ).length
      const isBusy = provider.bookings.some(
        b => b.status === 'IN_PROGRESS'
      )

      return {
        id: provider.id,
        userId: provider.userId,
        bio: provider.bio,
        district: provider.district,
        hourlyRate: provider.hourlyRate,
        profilePhoto: provider.profilePhoto,
        nicVerified: provider.nicVerified,
        verificationStatus: provider.verificationStatus,
        skills: provider.skills,
        createdAt: provider.createdAt,
        user: provider.user,
        services: provider.services,
        avgRating,
        reviewCount: ratings.length,
        completedJobs,
        isBusy
      }
    })

    res.json(providersWithStats)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch providers', details: error.message })
  }
}

// GET all unique service categories
exports.getCategories = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      select: { category: true },
      distinct: ['category']
    })
    const categories = services.map(s => s.category).filter(Boolean)
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch categories', details: error.message })
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
    const { bio, district, hourlyRate, skills, nicNumber } = req.body

    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' })
    }

    const updated = await prisma.provider.update({
      where: { userId: req.user.userId },
      data: {
        bio,
        district,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        skills: skills || [],
        nicNumber
      }
    })

    res.json({ message: 'Profile updated', provider: updated })
  } catch (error) {
    res.status(500).json({ error: 'Update failed', details: error.message })
  }
}

// GET currently logged in provider profile
exports.getMyProviderProfile = async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        services: true
      }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' })
    }

    res.json(provider)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch profile', details: error.message })
  }
}

// UPDATE profile photo (protected - provider only)
exports.updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' })
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'ceylink_profiles' },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ error: 'Failed to upload image to Cloudinary', details: error.message })
        }

        const updated = await prisma.provider.update({
          where: { id: provider.id },
          data: { profilePhoto: result.secure_url }
        })

        res.json({ message: 'Profile photo updated', profilePhoto: updated.profilePhoto })
      }
    )

    const stream = require('stream')
    const bufferStream = new stream.PassThrough()
    bufferStream.end(req.file.buffer)
    bufferStream.pipe(uploadStream)

  } catch (error) {
    res.status(500).json({ error: 'Photo upload failed', details: error.message })
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