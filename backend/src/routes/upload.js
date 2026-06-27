const express = require('express')
const router = express.Router()
const multer = require('multer')
const upload = require('../middleware/upload')
const authMiddleware = require('../middleware/auth')
const uploadController = require('../controllers/uploadController')

router.post('/photo', authMiddleware, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` })
    } else if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, uploadController.uploadPhoto)

module.exports = router