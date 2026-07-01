 const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Wipes all tables before each test file runs, so tests start from a clean slate
async function clearDatabase() {
  await prisma.review.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.user.deleteMany()
}

module.exports = { prisma, clearDatabase }
