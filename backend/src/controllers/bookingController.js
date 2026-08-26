const { validationResult } = require('express-validator')
const { notifyNewBooking, notifyBookingConfirmed, notifyBookingCancelled, notifyProviderCancelled } = require('../services/whatsappService')
const prisma = require('../utils/prismaClient')

// CREATE a booking (customer only)
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { serviceId, bookingDate, timeSlot, paymentMode, notes, isUrgent, photoUrls } = req.body

    // Find the service to get the provider and price
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { provider: true }
    })

    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    if (service.provider.userId === req.user.userId) {
      return res.status(403).json({ error: 'You cannot book your own service' })
    }

    // Check if the provider is already booked for this date and time slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        providerId: service.providerId,
        bookingDate: new Date(bookingDate),
        timeSlot,
        status: {
          not: 'CANCELLED'
        }
      }
    })

    if (existingBooking) {
      return res.status(400).json({ error: 'This time slot is already booked for this provider' })
    }

    const bookingRef = `#BK-${Math.floor(100000 + Math.random() * 900000)}`

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
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
        provider: { include: { user: { select: { name: true, phone: true } } } },
        customer: { select: { name: true } }
      }
    })

    // Notify the provider via WhatsApp (don't let this block the response if it fails)
    if (booking.provider.user.phone) {
      notifyNewBooking(
        booking.provider.user.phone,
        booking.customer?.name || 'A customer',
        booking.service.title,
        new Date(booking.bookingDate).toLocaleDateString(),
        booking.timeSlot
      )
    }

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
        payment: true,
        review: true
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
        customer: { select: { name: true, phone: true, address: true, email: true, profilePhoto: true } },
        payment: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const sanitizedBookings = bookings.map(booking => {
      if (['PENDING', 'CANCELLED'].includes(booking.status) && booking.customer) {

        booking.customer.address = null;
        booking.customer.phone = null;
      }
      return booking;
    })

    res.json(sanitizedBookings)

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

    // If no provider profile found, this user is not a provider
    if (!provider) {
      return res.status(403).json({ error: 'Only service providers can update booking status' })
    }

    // Prevent provider from starting a new job if one is already IN_PROGRESS
    if (status === 'IN_PROGRESS') {
      const activeJob = await prisma.booking.findFirst({
        where: {
          providerId: provider.id,
          status: 'IN_PROGRESS',
          id: { not: id } // exclude the current booking
        }
      })

      if (activeJob) {
        return res.status(400).json({
          error: 'You already have a job in progress. Please complete it before starting a new one.'
        })
      }
    }

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

    // Notify customer based on the new status
    const fullBooking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, service: true, provider: { include: { user: true } } }
    })

    if (fullBooking.customer.phone) {
      if (status === 'CONFIRMED') {
        await notifyBookingConfirmed(
          fullBooking.customer.phone,
          fullBooking.provider.user.name,
          fullBooking.service.title,
          new Date(fullBooking.bookingDate).toLocaleDateString(),
          fullBooking.timeSlot
        )
      } else if (status === 'CANCELLED') {
        await notifyBookingCancelled(fullBooking.customer.phone, fullBooking.service.title)
      }
    }

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

    // Notify the provider that the customer cancelled
    const fullBooking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true, provider: { include: { user: true } }, customer: true }
    })

    if (fullBooking.provider.user.phone) {
      await notifyProviderCancelled(
        fullBooking.provider.user.phone,
        fullBooking.customer.name,
        fullBooking.service.title
      )
    }

    res.json({ message: 'Booking cancelled', booking: updated })
  } catch (error) {
    console.error('Cancel booking error:', error)
    res.status(500).json({ error: 'Could not cancel booking', details: error.message })
  }
}