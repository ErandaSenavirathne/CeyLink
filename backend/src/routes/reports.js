const express = require('express')
const router = express.Router()
const reportController = require('../controllers/reportController')
const authMiddleware = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')

// CUSTOMER: Submit a report
router.post('/', authMiddleware, reportController.createReport)

// ADMIN: Get all reports (can filter by ?status=)
router.get('/', authMiddleware, adminAuth, reportController.getReports)

// ADMIN: Update report status
router.patch('/:id/status', authMiddleware, adminAuth, reportController.updateReportStatus)

module.exports = router
