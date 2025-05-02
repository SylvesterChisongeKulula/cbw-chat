const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();

// Get all users
router.get('/', userController.getAllUsers);

// Get a user by ID
router.get('/:userId', userController.getUserById);

// Create a new user
router.post('/', userController.createUser);

module.exports = router;