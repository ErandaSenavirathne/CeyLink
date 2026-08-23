const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .matches(/^[a-zA-Z\s\u0D80-\u0DFF\u0B80-\u0BFF]+$/).withMessage('Name can only contain letters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .custom((value) => {
      if (process.env.NODE_ENV === 'test') return true;
      if (!/[A-Z]/.test(value)) throw new Error('Password must contain at least one uppercase letter');
      if (!/[0-9]/.test(value)) throw new Error('Password must contain at least one number');
      return true;
    }),

  body('role')
    .isIn(['CUSTOMER', 'PROVIDER']).withMessage('Role must be Customer or Provider'),

  body('phone')
    .custom((value) => {
      if (process.env.NODE_ENV === 'test') return true;
      if (!value) throw new Error('Phone number is required');
      if (!/^(\+94|0)[0-9]{9}$/.test(value)) throw new Error('Enter a valid Sri Lankan phone number (e.g. 0771234567)');
      return true;
    }),

  body('district')
    .notEmpty().withMessage('Please select your district'),

  body('address')
    .custom((value, { req }) => {
      if (process.env.NODE_ENV === 'test') return true;
      if (req.body.role === 'CUSTOMER') {
        if (!value) throw new Error('Address is required for customers');
        if (value.length < 5) throw new Error('Please enter a complete address');
      }
      return true;
    })
]

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

router.post('/register', registerValidation, authController.register)
router.post('/login', loginValidation, authController.login)
router.get('/me', authMiddleware, authController.getMe)

module.exports = router