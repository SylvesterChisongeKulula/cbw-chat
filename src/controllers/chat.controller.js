const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

async function createChat(req, res, next) {
  try {
    const { user1Id, user2Id } = req.body;
    
    if (!user1Id || !user2Id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both user1Id and user2Id are required' 
      });
    }

    const chat = await chatService.createChat(req.prisma, user1Id, user2Id);
    return res.status(201).json({ success: true, data: chat });
  } catch (error) {
    logger.error('Error creating chat:', error);
    next(error);
  }
}

async function getUserChats(req, res, next) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'UserId is required' 
      });
    }

    const chats = await chatService.getUserChats(req.prisma, parseInt(userId));
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    logger.error('Error fetching user chats:', error);
    next(error);
  }
}

async function getChatMessages(req, res, next) {
  try {
    const { chatId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ChatId is required' 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await chatService.getChatMessages(
      req.prisma, 
      parseInt(chatId), 
      parseInt(limit), 
      skip
    );
    
    return res.status(200).json({ 
      success: true, 
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching chat messages:', error);
    next(error);
  }
}

async function getChatById(req, res, next) {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({ 
        success: false, 
        error: 'ChatId is required' 
      });
    }

    const chat = await chatService.getChatById(req.prisma, parseInt(chatId));
    
    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found' 
      });
    }
    
    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    logger.error('Error fetching chat by ID:', error);
    next(error);
  }
}

module.exports = {
  createChat,
  getUserChats,
  getChatMessages,
  getChatById
};