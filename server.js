require('dotenv').config();
const { app, server, prisma } = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// Connect to database and start server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Connected to database');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();