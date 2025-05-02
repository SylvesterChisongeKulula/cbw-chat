const express = require('express');
const userRoutes = require('./user.routes');
const chatRoutes = require('./chat.routes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/chats', chatRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;