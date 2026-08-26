const prisma = require('../utils/prismaClient')

exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch categories', details: error.message })
  }
}
