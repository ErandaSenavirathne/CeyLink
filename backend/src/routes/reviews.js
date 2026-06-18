const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const reviewController = require('../controllers/reviewController')
const authMiddleware = require('../middleware/auth')

const reviewValidation = [
  body('bookingId').notEmpty().withMessage('Booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5')
]

router.post('/', authMiddleware, reviewValidation, reviewController.createReview)
router.get('/provider/:providerId', reviewController.getProviderReviews)

module.exports = router