const express = require('express');
const userController = require('../controllers/userController');
const bcryptMiddleware = require('../middleware/bcryptMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');

const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/is-logged-in', userController.isLoggedIn);
router.get('/:id', userController.getUserById);

router.post('/register', bcryptMiddleware.hashPassword, userController.createUser);
router.post('/login', userController.loginUser, bcryptMiddleware.comparePassword, sessionMiddleware.generateSessionRedisUser);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', bcryptMiddleware.hashPassword, userController.resetPassword);
router.post('/logout', userController.logoutUser);

router.put('/:id', sessionMiddleware.checkForSessionUser, userController.updateUser);
router.put('/:id/password', sessionMiddleware.checkForSessionUser, bcryptMiddleware.hashNewPassword, userController.updatePassword);

router.delete('/:id', userController.deleteUser);

module.exports = router;
