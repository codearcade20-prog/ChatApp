import express from 'express';
import { enhanceMessage, predictCompletion, generateFromPrompt, checkGrammar } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/enhance', protect, enhanceMessage);
router.post('/autocomplete', protect, predictCompletion);
router.post('/generate', protect, generateFromPrompt);
router.post('/grammar-check', protect, checkGrammar);

export default router;
