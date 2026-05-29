import Message from '../models/Message.js';
import { enqueueMessage } from '../queue/queueService.js';

// @desc    Send a message (stores in DB & queues it)
// @route   POST /api/messages/send-message
// @access  Private
export const sendMessage = async (req, res) => {
  const { phone, message } = req.body;

  try {
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Please provide phone number and message content' });
    }

    // Input validation: simple check for phone format (digits only, length between 7 and 15)
    const phoneClean = phone.replace(/[^0-9+]/g, '');
    if (phoneClean.length < 7 || phoneClean.length > 15) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone number (7-15 digits)' });
    }

    // Create the message with status 'pending'
    const newMessage = await Message.create({
      phone: phoneClean,
      message,
      status: 'pending',
      user: req.user._id,
    });

    console.log(`[MessageController] Saved pending message: ${newMessage._id}`);

    // Queue the message for async processing
    await enqueueMessage(newMessage._id.toString());

    res.status(201).json({
      success: true,
      message: 'Message queued successfully',
      data: newMessage,
    });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};

// @desc    Get all messages for current user
// @route   GET /api/messages/history
// @access  Private
export const getMessageHistory = async (req, res) => {
  try {
    const history = await Message.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('GetHistory error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error' });
  }
};
