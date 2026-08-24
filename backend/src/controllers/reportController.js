const prisma = require('../utils/prismaClient')

// CUSTOMER: Submit a report for a provider
exports.createReport = async (req, res) => {
  try {
    const { providerId, reason, description } = req.body
    
    // Check if provider exists
    const provider = await prisma.provider.findUnique({
      where: { id: providerId }
    })
    
    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' })
    }

    const report = await prisma.report.create({
      data: {
        customerId: req.user.userId,
        providerId,
        reason,
        description: description || null
      }
    })

    res.status(201).json({ message: 'Report submitted successfully', report })
  } catch (error) {
    res.status(500).json({ error: 'Could not submit report', details: error.message })
  }
}

// ADMIN: Get all reports
exports.getReports = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query
    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.gte = new Date(startDate)
      if (endDate) dateFilter.createdAt.lte = new Date(endDate)
    }
    
    const reports = await prisma.report.findMany({
      where: {
        ...(status && { status }),
        ...dateFilter
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        provider: { 
          select: { 
            id: true, 
            verificationStatus: true,
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(reports)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch reports', details: error.message })
  }
}

// ADMIN: Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!['PENDING', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status }
    })

    res.json({ message: `Report marked as ${status}`, report })
  } catch (error) {
    res.status(500).json({ error: 'Could not update report', details: error.message })
  }
}
