const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Get user profile
router.get('/profile', protect, authController.getUserProfile);

// Update profile
router.put('/profile', protect, authController.updateUserProfile);

// Verify token
router.get('/verify', protect, authController.verifyToken);

// Forgot & reset password
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
