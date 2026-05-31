import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Sockets & Queue
import { initSocket } from './sockets/socketService.js';
import { initQueueService } from './queue/queueService.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Load config
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Base health route
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Server is running smoothly!' });
});

// Routes configuration
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/ai', aiRoutes);

// Custom Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Error Middleware]', err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Database Connection & Server Startup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-mini';
const PORT = process.env.PORT || 5000;

console.log('[Server] Connecting to MongoDB...');
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('[Server] Successfully connected to MongoDB database.');

    // Initialize queues (custom and/or BullMQ)
    await initQueueService();

    // Start Express HTTP Server
    server.listen(PORT, () => {
      console.log(`[Server] Mini WhatsApp Automation listening on port ${PORT}`);
      console.log(`[Server] Webhook delivery simulator active at http://localhost:${PORT}/api/webhook`);
    });
  })
  .catch((err) => {
    console.error('[Server] Critical: MongoDB connection failed!', err.message);
    process.exit(1);
  });
