const express = require('express');
const userController = require('../controllers/userController');
const bcryptMiddleware = require('../middleware/bcryptMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');
const {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
} = require('../config/rateLimitConfig');

const router = express.Router();

router.get('/', sessionMiddleware.checkForAdmin, userController.getAllUsers);
router.get('/is-logged-in', userController.isLoggedIn);
router.get('/:id', sessionMiddleware.checkForCurrentSessionUserOrAdmin, userController.getUserById);

router.post('/register', bcryptMiddleware.hashPassword, userController.createUser);
router.post('/login', loginRateLimiter, userController.loginUser, bcryptMiddleware.comparePassword, sessionMiddleware.generateSessionRedisUser);
router.post('/forgot-password', forgotPasswordRateLimiter, userController.forgotPassword);
router.post('/reset-password', resetPasswordRateLimiter, bcryptMiddleware.hashPassword, userController.resetPassword);
router.post('/logout', userController.logoutUser);

router.put('/:id', sessionMiddleware.checkForSessionUser, userController.updateUser);
router.put('/:id/password', sessionMiddleware.checkForSessionUser, bcryptMiddleware.hashNewPassword, userController.updatePassword);

router.delete('/:id', sessionMiddleware.checkForCurrentSessionUserOrAdmin, userController.deleteUser);

module.exports = router;
