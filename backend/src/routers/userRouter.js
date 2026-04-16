const express = require('express');
const userController = require('../controllers/userController');
const bcryptMiddleware = require('../middleware/bcryptMiddleware');
const sessionMiddleware = require('../middleware/sessionMiddleware');

const router = express.Router();

router.get('/', userController.getAllUsers);

router.post('/register', bcryptMiddleware.hashPassword, userController.createUser);

// router.post('/logout', userController.logoutUser);

router.get('/:id', userController.getUserById);

router.put('/:id', userController.updateUser);

router.delete('/:id', userController.deleteUser);

module.exports = router;   