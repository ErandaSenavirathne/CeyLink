const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const adminController = require('../controllers/adminController')

router.get('/stats', adminAuth, adminController.getStats)
router.get('/providers', adminAuth, adminController.getProviders)
router.patch('/providers/:id/verify', adminAuth, adminController.updateProviderVerification)
router.get('/users', adminAuth, adminController.getUsers)
router.post('/users', adminAuth, adminController.createUser)
router.put('/users/:id', adminAuth, adminController.updateUser)
router.get('/bookings', adminAuth, adminController.getBookings)
router.get('/services/pending', adminAuth, adminController.getPendingServices)
router.patch('/services/:id/review', adminAuth, adminController.reviewService)

module.exports = router