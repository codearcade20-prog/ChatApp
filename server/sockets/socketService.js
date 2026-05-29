import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Global helper to emit status updates
export const emitStatusUpdate = (messageId, status) => {
  try {
    const ioInstance = getIO();
    console.log(`[Socket] Emitting status update for ${messageId} -> ${status}`);
    ioInstance.emit('status-updated', { messageId, status });
  } catch (error) {
    console.error('[Socket] Failed to emit status update:', error.message);
  }
};
