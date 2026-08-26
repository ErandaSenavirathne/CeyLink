const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultCategories = [
  { icon: '🚿', nameEn: 'Plumbing', nameSi: 'ජලනල', nameTa: 'குழாய் வேலை' },
  { icon: '⚡', nameEn: 'Electrical', nameSi: 'විදුලි', nameTa: 'மின்சாரம்' },
  { icon: '🪚', nameEn: 'Carpentry', nameSi: 'වඩු වැඩ', nameTa: 'தச்சு வேலை' },
  { icon: '🎨', nameEn: 'Painting', nameSi: 'පින්තාරු', nameTa: 'வர்ணம் பூசுதல்' },
  { icon: '🧹', nameEn: 'Cleaning', nameSi: 'පිරිසිදු කිරීම', nameTa: 'சுத்தம் செய்தல்' },
  { icon: '📚', nameEn: 'Tutoring', nameSi: 'උපකාරක පන්ති', nameTa: 'பயிற்சி' },
  { icon: '💇', nameEn: 'Beauty & Hair', nameSi: 'රූපලාවන්‍ය', nameTa: 'அழகு' },
  { icon: '🌿', nameEn: 'Gardening', nameSi: 'ගෙවතු වගාව', nameTa: 'தோட்டம்' },
  { icon: '❄️', nameEn: 'AC Repair', nameSi: 'වායුසමීකරණ අළුත්වැඩියාව', nameTa: 'ஏசி பழுது' },
  { icon: '🛠️', nameEn: 'Other', nameSi: 'වෙනත්', nameTa: 'மற்றவை' }
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of defaultCategories) {
    const exists = await prisma.category.findFirst({ where: { nameEn: cat.nameEn } })
    if (!exists) {
      await prisma.category.create({ data: cat })
      console.log(`Created category: ${cat.nameEn}`)
    }
  }
  console.log('Finished seeding categories.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
