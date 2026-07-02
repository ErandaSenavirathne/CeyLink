const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabase() {
  // TRUNCATE with CASCADE handles all foreign key relationships automatically
  // regardless of table order — much more reliable than sequential deleteMany
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "Review", "Payment", "Booking", "Service", "Provider", "User" 
    RESTART IDENTITY CASCADE
  `)
}

module.exports = { prisma, clearDatabase }