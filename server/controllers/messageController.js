import Message from '../models/Message.js';
import User from '../models/User.js';
import { enqueueMessage } from '../queue/queueService.js';
import { getIO } from '../sockets/socketService.js';

// @desc    Send a message to a registered contact (stores in DB & queues it)
// @route   POST /api/messages/send-message
// @access  Private
export const sendMessage = async (req, res) => {
  const { recipientId, message } = req.body;

  try {
    if (!recipientId || !message) {
      return res.status(400).json({ success: false, error: 'Please provide recipient and message content' });
    }

    // Find the recipient user to get their registered phone number
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, error: 'Recipient user not found' });
    }

    // Create the message with status 'pending'
    const newMessage = await Message.create({
      phone: recipient.phone,
      message,
      status: 'pending',
      user: req.user._id,
      recipient: recipient._id,
    });

    console.log(`[MessageController] Saved pending direct message: ${newMessage._id}`);

    // Queue the message for async processing (maintains full compatibility)
    await enqueueMessage(newMessage._id.toString());

    // Emit socket event for real-time delivery
    try {
      const ioInstance = getIO();
      // Emit globally so both sender and recipient update their active chat UI
      ioInstance.emit('new-message', newMessage);
    } catch (socketErr) {
      console.warn('[MessageController] Socket new-message emission failed:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Message queued and enqueued successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// @desc    Get message history between current user and specified contact
// @route   GET /api/messages/history
// @access  Private
export const getMessageHistory = async (req, res) => {
  const { contactId } = req.query;

  try {
    let query = {};
    let sort = { createdAt: -1 };

    if (contactId) {
      // Direct chat history: messages between these two users (sent and received)
      query = {
        $or: [
          { user: req.user._id, recipient: contactId },
          { user: contactId, recipient: req.user._id },
        ],
      };
      sort = { createdAt: 1 }; // Chronological order (oldest first)
    } else {
      // Fallback: all messages involving the logged-in user
      query = {
        $or: [
          { user: req.user._id },
          { recipient: req.user._id },
        ],
      };
    }

    const history = await Message.find(query).sort(sort);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('GetHistory error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
