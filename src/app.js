const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const routes = require('./routes');
const socketHandler = require('./socket');
const errorMiddleware = require('./middlewares/error.middleware');
const logger = require('./utils/logger');

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Prisma available in request
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api', routes);

// Socket.io setup
socketHandler(io, prisma);

// Error handling middleware
app.use(errorMiddleware);

// Process cleanup
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = { app, server, prisma };