const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // 1. Fetch some existing categories to use for services
  let categories = await prisma.category.findMany()
  if (categories.length === 0) {
    console.log('No categories found. Creating a generic one...')
    const cat = await prisma.category.create({
      data: {
        nameEn: 'Home Repairs',
        nameSi: 'නිවාස අලුත්වැඩියාව',
        nameTa: 'வீட்டு திருத்தங்கள்',
        icon: '🔧'
      }
    })
    categories = [cat]
  }

  // Common arrays for generation
  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Kalutara', 'Galle']
  const firstNames = ['Amal', 'Kamal', 'Nimal', 'Sunil', 'Saman', 'Nuwan', 'Kasun', 'Ruwan', 'Gayan', 'Lahiru', 'Dinesh', 'Pradeep', 'Asanka']
  const lastNames = ['Perera', 'Silva', 'Fernando', 'De Silva', 'Peiris', 'Bandara', 'Kumara', 'Jayawardena', 'Rajapaksa', 'Senanayake']
  
  const generatePhone = () => '+947' + Math.floor(Math.random() * 90000000 + 10000000).toString()
  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 2. Create 10 Customers
  console.log('👤 Creating 10 customers...')
  const customers = []
  for (let i = 0; i < 10; i++) {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`
    const user = await prisma.user.create({
      data: {
        email: `customer${i + 1}_${Date.now()}@example.com`,
        password: hashedPassword,
        name: name,
        phone: generatePhone(),
        role: 'CUSTOMER',
        district: randomItem(districts),
        city: 'City ' + (i + 1)
      }
    })
    customers.push(user)
  }

  // 3. Create 10 Providers
  console.log('👷 Creating 10 providers...')
  const providers = []
  for (let i = 0; i < 10; i++) {
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`
    const district = randomItem(districts)
    
    const user = await prisma.user.create({
      data: {
        email: `provider${i + 1}_${Date.now()}@example.com`,
        password: hashedPassword,
        name: name,
        phone: generatePhone(),
        role: 'PROVIDER',
        district: district,
        city: `${district} City`
      }
    })

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        bio: `Experienced professional serving the ${district} area.`,
        nicNumber: Math.floor(100000000 + Math.random() * 900000000).toString() + 'V',
        verificationStatus: 'VERIFIED',
        district: district,
        city: `${district} City`,
        hourlyRate: Math.floor(Math.random() * 3000) + 1000,
        skills: ['Expert', 'Reliable', 'Fast']
      }
    })
    providers.push(provider)
  }

  // 4. Create 10 Services (1 per provider)
  console.log('🛠️ Creating 10 services...')
  const services = []
  for (let i = 0; i < 10; i++) {
    const category = randomItem(categories).nameEn
    const service = await prisma.service.create({
      data: {
        providerId: providers[i].id,
        category: category,
        title: `Professional ${category} Service`,
        description: `Top-rated ${category} service in my area. Satisfaction guaranteed.`,
        basePrice: Math.floor(Math.random() * 5000) + 1000,
        status: 'APPROVED'
      }
    })
    services.push(service)
  }

  // 5. Create 20 Bookings
  console.log('📅 Creating 20 bookings and reviews...')
  const statuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  
  for (let i = 0; i < 20; i++) {
    const customer = randomItem(customers)
    const service = randomItem(services)
    const status = randomItem(statuses)
    
    // Create random 6-digit reference ID
    const refNum = Math.floor(100000 + Math.random() * 900000)
    const bookingRef = `#BK-${refNum}`

    const booking = await prisma.booking.create({
      data: {
        bookingRef,
        customerId: customer.id,
        providerId: service.providerId,
        serviceId: service.id,
        bookingDate: new Date(Date.now() + Math.random() * 10000000000), // Random future date
        timeSlot: '10:00 AM',
        totalAmount: service.basePrice,
        status: status,
        paymentMode: 'CASH'
      }
    })

    // If completed, add a review
    if (status === 'COMPLETED') {
      await prisma.review.create({
        data: {
          bookingId: booking.id,
          customerId: customer.id,
          providerId: service.providerId,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          reviewText: 'Great service! Highly recommended.'
        }
      })
    }
  }

  console.log('✅ Seeding completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
