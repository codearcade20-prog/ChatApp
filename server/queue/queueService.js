import customQueue from './customQueue.js';
import { initBullQueue, enqueueBullMessage } from './bullQueue.js';

let activeQueueType = 'custom';

export const initQueueService = async () => {
  const preferredType = process.env.QUEUE_TYPE || 'custom';

  if (preferredType === 'bullmq') {
    try {
      console.log('[QueueService] Attempting to initialize BullMQ + Redis...');
      initBullQueue();
      activeQueueType = 'bullmq';
      console.log('[QueueService] Using BullMQ as the active message queue.');
    } catch (err) {
      console.warn('[QueueService] BullMQ init failed. Falling back to Custom MongoDB-backed Queue.');
      activeQueueType = 'custom';
      await customQueue.recoverPending();
    }
  } else {
    console.log('[QueueService] Using Custom MongoDB-backed Queue.');
    activeQueueType = 'custom';
    await customQueue.recoverPending();
  }
};

export const enqueueMessage = async (messageId) => {
  if (activeQueueType === 'bullmq') {
    try {
      await enqueueBullMessage(messageId);
    } catch (err) {
      console.error('[QueueService] BullMQ enqueue failed. Falling back dynamically to Custom Queue.');
      await customQueue.add(messageId);
    }
  } else {
    await customQueue.add(messageId);
  }
};

export const getActiveQueueType = () => activeQueueType;
