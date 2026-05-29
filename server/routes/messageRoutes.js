import express from 'express';
import { sendMessage, getMessageHistory } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/send-message', protect, sendMessage);
router.get('/history', protect, getMessageHistory);

export default router;
