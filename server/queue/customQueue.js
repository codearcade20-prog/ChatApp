import Message from '../models/Message.js';
import { emitStatusUpdate } from '../sockets/socketService.js';

class CustomQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Add a new message ID to the queue
  async add(messageId) {
    console.log(`[CustomQueue] Enqueued message: ${messageId}`);
    this.queue.push(messageId);
    this.processNext();
  }

  // Process next item in the queue sequentially
  async processNext() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) {
      console.log('[CustomQueue] Queue is empty. Worker is idling.');
      return;
    }

    this.isProcessing = true;
    const messageId = this.queue.shift();

    try {
      console.log(`[CustomQueue] Worker started processing message: ${messageId}`);

      // 1. Simulate WhatsApp message sending (3-second delay)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 2. Update status in MongoDB
      const message = await Message.findById(messageId);
      if (message) {
        message.status = 'sent';
        await message.save();
        console.log(`[CustomQueue] Message ${messageId} successfully processed and marked 'sent'`);

        // 3. Trigger Socket.IO real-time update
        emitStatusUpdate(messageId, 'sent');
      } else {
        console.warn(`[CustomQueue] Message not found: ${messageId}`);
      }
    } catch (error) {
      console.error(`[CustomQueue] Error processing message ${messageId}:`, error.message);
      
      // Update to failed in DB
      try {
        const message = await Message.findById(messageId);
        if (message) {
          message.status = 'failed';
          await message.save();
          emitStatusUpdate(messageId, 'failed');
        }
      } catch (dbErr) {
        console.error(`[CustomQueue] Failed to update error status for ${messageId}:`, dbErr.message);
      }
    } finally {
      this.isProcessing = false;
      // Process next message in the queue
      this.processNext();
    }
  }

  // On server startup, we can query the database for any 'pending' messages and process them
  async recoverPending() {
    try {
      const pendingMessages = await Message.find({ status: 'pending' }).sort({ createdAt: 1 });
      if (pendingMessages.length > 0) {
        console.log(`[CustomQueue] Recovered ${pendingMessages.length} pending messages on startup. Enqueueing...`);
        for (const msg of pendingMessages) {
          this.queue.push(msg._id.toString());
        }
        this.processNext();
      }
    } catch (error) {
      console.error('[CustomQueue] Error recovering pending messages:', error.message);
    }
  }
}

const customQueueInstance = new CustomQueue();
export default customQueueInstance;
