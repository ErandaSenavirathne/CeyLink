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
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),

  body('role')
    .isIn(['CUSTOMER', 'PROVIDER']).withMessage('Role must be Customer or Provider'),

  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+94|0)[0-9]{9}$/).withMessage('Enter a valid Sri Lankan phone number (e.g. 0771234567)'),

  body('district')
    .notEmpty().withMessage('Please select your district'),

  body('address')
    .if(body('role').equals('CUSTOMER'))
    .notEmpty().withMessage('Address is required for customers')
    .isLength({ min: 5 }).withMessage('Please enter a complete address')
]

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]

router.post('/register', registerValidation, authController.register)
router.post('/login', loginValidation, authController.login)
router.get('/me', authMiddleware, authController.getMe)

module.exports = router