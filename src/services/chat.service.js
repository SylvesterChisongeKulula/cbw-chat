const { Prisma } = require('@prisma/client');
const logger = require('../utils/logger');

/**
 * Create a new chat between two users
 */
async function createChat(prisma, user1Id, user2Id) {
  try {
    // Ensure user1Id is always less than user2Id for consistency
    const [smallerId, largerId] = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);
    
    // Check if both users exist
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [smallerId, largerId]
        }
      }
    });
    
    if (users.length !== 2) {
      throw new Error('One or both users do not exist');
    }
    
    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        user1Id: smallerId,
        user2Id: largerId
      }
    });
    
    if (existingChat) {
      return existingChat;
    }
    
    // Create new chat
    return await prisma.chat.create({
      data: {
        user1Id: smallerId,
        user2Id: largerId
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        logger.warn('Chat already exists between these users');
        throw new Error('Chat already exists between these users');
      }
    }
    throw error;
  }
}

/**
 * Get all chats for a specific user
 */
async function getUserChats(prisma, userId) {
  const parsedUserId = parseInt(userId);
  
  const chats = await prisma.chat.findMany({
    where: {
      OR: [
        { user1Id: parsedUserId },
        { user2Id: parsedUserId }
      ]
    },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      user2: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
  
  // Transform the data to include the other user and latest message
  return chats.map(chat => {
    const otherUser = chat.user1Id === parsedUserId ? chat.user2 : chat.user1;
    return {
      id: chat.id,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      otherUser,
      latestMessage: chat.messages[0] || null,
      unreadCount: 0 // This would need additional query to calculate
    };
  });
}

/**
 * Get all messages for a specific chat
 */
async function getChatMessages(prisma, chatId, limit = 50, skip = 0) {
  const parsedChatId = parseInt(chatId);
  
  // First, check if chat exists
  const chat = await prisma.chat.findUnique({
    where: { id: parsedChatId }
  });
  
  if (!chat) {
    throw new Error('Chat not found');
  }
  
  // Get messages with pagination (newest first)
  const messages = await prisma.message.findMany({
    where: { chatId: parsedChatId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: skip
  });

  // Get total count for pagination
  const totalCount = await prisma.message.count({
    where: { chatId: parsedChatId }
  });
  
  return {
    messages: messages.reverse(), // Return in chronological order
    totalCount
  };
}

/**
 * Get a specific chat by ID
 */
async function getChatById(prisma, chatId) {
  const parsedChatId = parseInt(chatId);
  
  return await prisma.chat.findUnique({
    where: { id: parsedChatId },
    include: {
      user1: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      },
      user2: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  });
}

module.exports = {
  createChat,
  getUserChats,
  getChatMessages,
  getChatById
};