const prisma = require('../utils/prismaClient')

// CREATE a review (customer only, after booking is COMPLETED)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, reviewText } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.customerId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only review your own bookings' })
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'You can only review completed bookings' })
    }

    if (booking.review) {
      return res.status(400).json({ error: 'You have already reviewed this booking' })
    }

    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId: req.user.userId,
        providerId: booking.providerId,
        rating,
        reviewText
      }
    })

    res.status(201).json({ message: 'Review submitted successfully', review })
  } catch (error) {
    res.status(500).json({ error: 'Could not submit review', details: error.message })
  }
}

// GET reviews for a specific provider
exports.getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params

    const reviews = await prisma.review.findMany({
      where: { providerId },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    })

    res.json(reviews)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch reviews', details: error.message })
  }
}