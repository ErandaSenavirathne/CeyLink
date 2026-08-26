const prisma = require('../utils/prismaClient')
const cloudinary = require('../utils/cloudinary')

// GET all providers (with optional filters)
exports.getProviders = async (req, res) => {
  try {
    const { district, city, category, search, page = 1, limit = 10, nearMe, userCity, userDistrict } = req.query

    const pageNumber = parseInt(page, 10)
    const pageSize = parseInt(limit, 10)
    const skip = (pageNumber - 1) * pageSize

    // Build the dynamic where clause
    const whereClause = {
      ...(district && { district }),
      ...(city && {
        OR: [
          { city: city },
          { city: null },
          { city: '' }
        ]
      }),
      verificationStatus: 'VERIFIED',
      user: { isActive: true },
      ...(category && {
        services: { some: { category, status: 'APPROVED' } }
      }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { services: { some: { title: { contains: search, mode: 'insensitive' } } } },
          { services: { some: { category: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    }

    let totalProviders = 0
    let providers = []

    if (nearMe === 'true' && userDistrict) {
      // Fetch all matching providers to sort in JS by proximity
      const allProviders = await prisma.provider.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, phone: true, createdAt: true } },
          services: { where: { status: 'APPROVED' } },
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

      // Sort logic
      allProviders.sort((a, b) => {
        const aCityMatch = a.city === userCity ? 1 : 0
        const bCityMatch = b.city === userCity ? 1 : 0
        if (aCityMatch !== bCityMatch) return bCityMatch - aCityMatch

        const aDistrictMatch = a.district === userDistrict ? 1 : 0
        const bDistrictMatch = b.district === userDistrict ? 1 : 0
        if (aDistrictMatch !== bDistrictMatch) return bDistrictMatch - aDistrictMatch

        return 0 // Keep original order if both are same level
      })

      totalProviders = allProviders.length
      providers = allProviders.slice(skip, skip + pageSize)
      
      // Inject proximity label for frontend
      providers = providers.map(p => {
        let proximity = 'Other district'
        if (p.city === userCity) proximity = 'Same city as you'
        else if (p.district === userDistrict) proximity = 'Same district as you'
        return { ...p, proximityLabel: proximity }
      })

    } else {
      // Standard database pagination
      const [count, paginatedProviders] = await prisma.$transaction([
        prisma.provider.count({ where: whereClause }),
        prisma.provider.findMany({
          where: whereClause,
          skip,
          take: pageSize,
          include: {
            user: { select: { name: true, phone: true, createdAt: true } },
            services: { where: { status: 'APPROVED' } },
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
      ])
      totalProviders = count
      providers = paginatedProviders
    }

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

    res.json({
      data: providersWithStats,
      pagination: {
        total: totalProviders,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(totalProviders / pageSize)
      }
    })
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
        user: { select: { name: true, phone: true, email: true, createdAt: true } },
        services: { where: { status: 'APPROVED' } },
        reviews: {
          include: { customer: { select: { name: true, profilePhoto: true } } },
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          select: { id: true, status: true }
        }
      }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' })
    }

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

    // Mask customer identity in reviews for safety
    const maskedReviews = provider.reviews.map(r => ({
      ...r,
      customer: {
        name: 'Anonymous Customer',
        profilePhoto: null
      }
    }))

    res.json({
      ...provider,
      reviews: maskedReviews,
      avgRating,
      reviewCount: ratings.length,
      completedJobs,
      isBusy
    })
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch provider', details: error.message })
  }
}

// UPDATE provider profile (protected - only the provider themselves)
exports.updateProvider = async (req, res) => {
  try {
    const { bio, district, city, skills, nicNumber } = req.body

    if (nicNumber) {
      const oldFormat = /^[0-9]{9}[VvXx]$/
      const newFormat = /^[0-9]{12}$/

      if (!oldFormat.test(nicNumber) && !newFormat.test(nicNumber)) {
        return res.status(400).json({
          error: 'Invalid NIC format. Use 9 digits + V/X (e.g. 123456789V) or 12 digits (e.g. 200012345678).'
        })
      }

      const existingNIC = await prisma.provider.findFirst({
        where: {
          nicNumber,
          NOT: { userId: req.user.userId } // exclude the current provider
        }
      })

      if (existingNIC) {
        return res.status(400).json({
          error: 'This NIC number is already registered with another provider account.'
        })
      }
    }

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
        city: city || null,
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
        basePrice: parseFloat(basePrice),
        status: 'PENDING'
      }
    })

    res.status(201).json({ message: 'Service submitted for admin review', service })
  } catch (error) {
    res.status(500).json({ error: 'Could not add service', details: error.message })
  }
}

// UPDATE a service (protected - provider only)
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params
    const { category, title, description, basePrice } = req.body

    const service = await prisma.service.findUnique({
      where: { id },
      include: { provider: true }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (service.provider.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to update this service' })
    }

    const titleChanged = title !== undefined && title !== service.title;
    const descriptionChanged = description !== undefined && description !== (service.description || '');
    const categoryChanged = category !== undefined && category !== service.category;

    const needsReview = titleChanged || descriptionChanged || categoryChanged;

    if (!needsReview) {
      // Only price change (or no changes at all)
      const updated = await prisma.service.update({
        where: { id },
        data: {
          basePrice: basePrice !== undefined ? parseFloat(basePrice) : service.basePrice
        }
      })
      return res.json({ message: 'Price updated', service: updated })
    } else {
      // Needs review
      const updated = await prisma.service.update({
        where: { id },
        data: {
          category: category !== undefined ? category : service.category,
          title: title !== undefined ? title : service.title,
          description: description !== undefined ? description : service.description,
          basePrice: basePrice !== undefined ? parseFloat(basePrice) : service.basePrice,
          status: 'PENDING'
        }
      })
      return res.json({ message: 'Service updated and resubmitted for review', service: updated })
    }
  } catch (error) {
    res.status(500).json({ error: 'Could not update service', details: error.message })
  }
}

// DELETE a service (protected - provider only)
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params

    const service = await prisma.service.findUnique({
      where: { id },
      include: { provider: true }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (service.provider.userId !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this service' })
    }

    await prisma.service.delete({ where: { id } })

    res.json({ message: 'Service deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Could not delete service', details: error.message })
  }
}

// GET all services for logged-in provider (protected)
exports.getMyServices = async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' })
    }

    const services = await prisma.service.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json(services)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch services', details: error.message })
  }
}