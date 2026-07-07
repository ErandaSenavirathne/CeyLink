const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const adminController = require('../controllers/adminController')

router.get('/stats', adminAuth, adminController.getStats)
router.get('/providers', adminAuth, adminController.getProviders)
router.patch('/providers/:id/verify', adminAuth, adminController.updateProviderVerification)
router.get('/users', adminAuth, adminController.getUsers)
router.get('/bookings', adminAuth, adminController.getBookings)

module.exports = router