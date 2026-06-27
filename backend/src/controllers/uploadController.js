const cloudinary = require('../utils/cloudinary')

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Convert the file buffer to a base64 string Cloudinary can accept
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const result = await cloudinary.uploader.upload(base64, {
      folder: 'ceylink/bookings',
      transformation: [{ width: 1000, height: 1000, crop: 'limit', quality: 'auto' }]
    })

    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message })
  }
}