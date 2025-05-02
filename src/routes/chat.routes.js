const express = require('express');
const chatController = require('../controllers/chat.controller');
const router = express.Router();

// Create a new chat between two users
router.post('/', chatController.createChat);

// Get all chats for a specific user
router.get('/user/:userId', chatController.getUserChats);

// Get chat history (messages) for a specific chat
router.get('/:chatId/messages', chatController.getChatMessages);

// Get a specific chat by ID
router.get('/:chatId', chatController.getChatById);

module.exports = router;