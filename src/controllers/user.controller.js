const userService = require('../services/user.service');
const logger = require('../utils/logger');

async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers(req.prisma);
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching all users:', error);
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'UserId is required' 
      });
    }

    const user = await userService.getUserById(req.prisma, parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error('Error fetching user by ID:', error);
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { username, displayName } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      });
    }

    const user = await userService.createUser(req.prisma, { username, displayName });
    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    logger.error('Error creating user:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        success: false, 
        error: 'Username already exists' 
      });
    }
    
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser
};