const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const providerController = require('../controllers/providerController')
const authMiddleware = require('../middleware/auth')
const upload = require('../middleware/upload')

const serviceValidation = [
  body('category').notEmpty().withMessage('Category is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('basePrice').isNumeric().withMessage('Base price must be a number')
]

router.get('/', providerController.getProviders)
router.get('/categories', providerController.getCategories)
router.get('/my-profile', authMiddleware, providerController.getMyProviderProfile)
router.get('/:id', providerController.getProviderById)
router.put('/profile', authMiddleware, providerController.updateProvider)
router.post('/profile-photo', authMiddleware, upload.single('photo'), providerController.updateProfilePhoto)
router.post('/services', authMiddleware, serviceValidation, providerController.addService)

module.exports = router