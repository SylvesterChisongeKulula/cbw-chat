const logger = require('../utils/logger');

function socketHandler(io, prisma) {
  // Keep track of online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle user joining
    socket.on('user:join', async (userId) => {
      try {
        // Associate socket with userId
        onlineUsers.set(socket.id, userId);
        socket.join(`user:${userId}`);  
        
        logger.info(`User ${userId} joined with socket ${socket.id}`);
        
        // Notify user's contacts that they're online
        const userChats = await prisma.chat.findMany({
          where: {
            OR: [
              { user1Id: parseInt(userId) },
              { user2Id: parseInt(userId) }
            ]
          },
          select: {
            user1Id: true,
            user2Id: true
          }
        });
        
        const contacts = userChats.flatMap(chat => 
          [chat.user1Id, chat.user2Id].filter(id => id !== parseInt(userId))
        );
        
        // Remove duplicates
        const uniqueContacts = [...new Set(contacts)];
        
        uniqueContacts.forEach(contactId => {
          io.to(`user:${contactId}`).emit('user:online', parseInt(userId));
        });
      } catch (error) {
        logger.error('Error in user:join handler:', error);
      }
    });

    // Handle new messages
    socket.on('message:send', async (data) => {
      try {
        const { chatId, content } = data;
        const senderId = onlineUsers.get(socket.id);
        
        if (!senderId) {
          socket.emit('error', { message: 'You must be identified to send messages' });
          return;
        }
        
        // Save message to database
        const message = await prisma.message.create({
          data: {
            chatId: parseInt(chatId),
            senderId: parseInt(senderId),
            content
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true
              }
            }
          }
        });

        // Get chat to find recipient
        // Make sure chatId is a number
        const chatIdNum = typeof chatId === 'string' ? parseInt(chatId, 10) : chatId;
        
        const chat = await prisma.chat.findUnique({
          where: {
            id: chatIdNum
          },
          select: { user1Id: true, user2Id: true }
        });
        
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }
        
        // Determine recipient
        const recipientId = chat.user1Id === parseInt(senderId) 
          ? chat.user2Id 
          : chat.user1Id;
        
        // Send message to recipient and back to sender
        io.to(`user:${recipientId}`).emit('message:new', message);
        socket.emit('message:sent', message);
        
        // Also broadcast to a chat-specific room to ensure all connected clients receive updates
        io.to(`chat:${chatIdNum}`).emit('chat:updated', {
          chatId: chatIdNum,
          lastMessage: message
        });
        
      } catch (error) {
        logger.error('Error in message:send handler:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', async (data) => {
      try {
        const userId = onlineUsers.get(socket.id);
        if (!userId) return;
        
        // Extract chatId from the data parameter
        let chatIdNum;
        
        if (typeof data === 'object' && data !== null) {
          // If data is an object, extract the chatId property
          chatIdNum = typeof data.chatId === 'string' ? parseInt(data.chatId, 10) : data.chatId;
        } else {
          // If data is not an object, treat it as the chatId directly
          chatIdNum = typeof data === 'string' ? parseInt(data, 10) : data;
        }
        
        // Ensure we have a valid chatId
        if (!chatIdNum) {
          logger.error('Invalid chatId in typing:start event', { data });
          return;
        }
        
        const chat = await prisma.chat.findUnique({
          where: {
            id: chatIdNum
          },
          select: { user1Id: true, user2Id: true }
        });
        
        if (!chat) return;
        
        const recipientId = chat.user1Id === parseInt(userId) 
          ? chat.user2Id 
          : chat.user1Id;
        
        io.to(`user:${recipientId}`).emit('typing:start', { 
          chatId: chatIdNum, 
          userId: parseInt(userId) 
        });
      } catch (error) {
        logger.error('Error in typing:start handler:', error);
      }
    });
    
    socket.on('typing:stop', async (data) => {
      try {
        const userId = onlineUsers.get(socket.id);
        if (!userId) return;
        
        // Extract chatId from the data parameter
        let chatIdNum;
        
        if (typeof data === 'object' && data !== null) {
          // If data is an object, extract the chatId property
          chatIdNum = typeof data.chatId === 'string' ? parseInt(data.chatId, 10) : data.chatId;
        } else {
          // If data is not an object, treat it as the chatId directly
          chatIdNum = typeof data === 'string' ? parseInt(data, 10) : data;
        }
        
        // Ensure we have a valid chatId
        if (!chatIdNum) {
          logger.error('Invalid chatId in typing:stop event', { data });
          return;
        }
        
        const chat = await prisma.chat.findUnique({
          where: {
            id: chatIdNum
          },
          select: { user1Id: true, user2Id: true }
        });
        
        if (!chat) return;
        
        const recipientId = chat.user1Id === parseInt(userId) 
          ? chat.user2Id 
          : chat.user1Id;
        
        io.to(`user:${recipientId}`).emit('typing:stop', { 
          chatId: chatIdNum, 
          userId: parseInt(userId) 
        });
      } catch (error) {
        logger.error('Error in typing:stop handler:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = onlineUsers.get(socket.id);
      if (userId) {
        logger.info(`User ${userId} disconnected`);
        onlineUsers.delete(socket.id);
        
        // You could notify contacts that user is offline here
      }
    });
  });
}

module.exports = socketHandler;