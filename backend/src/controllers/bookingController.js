const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// CREATE a booking (customer only)
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, bookingDate, timeSlot, paymentMode, notes, isUrgent, photoUrls } = req.body

    // Find the service to get the provider and price
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.userId,
        providerId: service.providerId,
        serviceId: service.id,
        bookingDate: new Date(bookingDate),
        timeSlot,
        paymentMode: paymentMode || 'CASH',
        notes,
        isUrgent: isUrgent || false,
        photoUrls: photoUrls || [],
        totalAmount: service.basePrice,
        status: 'PENDING'
      },
      include: {
        service: true,
        provider: { include: { user: { select: { name: true, phone: true } } } }
      }
    })

    res.status(201).json({ message: 'Booking created successfully', booking })
  } catch (error) {
    res.status(500).json({ error: 'Could not create booking', details: error.message })
  }
}

// GET bookings for the logged-in customer
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.user.userId },
      include: {
        service: true,
        provider: { include: { user: { select: { name: true, phone: true } } } },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch bookings', details: error.message })
  }
}

// GET bookings for the logged-in provider
exports.getProviderBookings = async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    if (!provider) {
      return res.status(404).json({ error: 'Provider profile not found' })
    }

    const bookings = await prisma.booking.findMany({
      where: { providerId: provider.id },
      include: {
        service: true,
        customer: { select: { name: true, phone: true } },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch bookings', details: error.message })
  }
}

// UPDATE booking status (provider accepts/rejects/completes)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    // Verify this booking belongs to the logged-in provider
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.userId }
    })

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.providerId !== provider.id) {
      return res.status(403).json({ error: 'You are not authorized to update this booking' })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status }
    })

    res.json({ message: `Booking status updated to ${status}`, booking: updated })
  } catch (error) {
    res.status(500).json({ error: 'Could not update booking', details: error.message })
  }
}

// CANCEL booking (customer only, before it's confirmed)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params

    const booking = await prisma.booking.findUnique({ where: { id } })

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    if (booking.customerId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' })
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' }
    })

    res.json({ message: 'Booking cancelled', booking: updated })
  } catch (error) {
    res.status(500).json({ error: 'Could not cancel booking', details: error.message })
  }
}