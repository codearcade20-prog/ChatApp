import Message from '../models/Message.js';
import { emitStatusUpdate } from '../sockets/socketService.js';

// @desc    Webhook receiver to simulate WhatsApp status updates (e.g. delivered)
// @route   POST /api/webhook
// @access  Public
export const handleWebhook = async (req, res) => {
  const { messageId, status } = req.body;

  try {
    if (!messageId || !status) {
      return res.status(400).json({ success: false, error: 'Please provide messageId and status' });
    }

    if (!['pending', 'sent', 'failed', 'delivered'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid message status for webhook' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Update message status
    message.status = status;
    await message.save();

    console.log(`[Webhook] Message ${messageId} updated to status: ${status}`);

    // Emit live status update to Socket clients
    emitStatusUpdate(messageId, status);

    res.json({
      success: true,
      message: `Message status updated to ${status} via webhook`,
      data: message,
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
