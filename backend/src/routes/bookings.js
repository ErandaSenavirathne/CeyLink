const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const bookingController = require('../controllers/bookingController')
const authMiddleware = require('../middleware/auth')

const bookingValidation = [
  body('serviceId').notEmpty().withMessage('Service ID is required'),
  body('bookingDate').isISO8601().withMessage('Valid date is required (YYYY-MM-DD)'),
  body('timeSlot').notEmpty().withMessage('Time slot is required')
]

router.post('/', authMiddleware, bookingValidation, bookingController.createBooking)
router.get('/my-bookings', authMiddleware, bookingController.getMyBookings)
router.get('/provider-bookings', authMiddleware, bookingController.getProviderBookings)
router.patch('/:id/status', authMiddleware, bookingController.updateBookingStatus)
router.patch('/:id/cancel', authMiddleware, bookingController.cancelBooking)

module.exports = router