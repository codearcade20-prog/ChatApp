import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Require a 32-character key. We'll read from env or use a static robust fallback key.
const SECRET_KEY = process.env.CRYPTO_SECRET || 'supersecretcryptomessagingkey123'; 
const IV_LENGTH = 16; // AES block size in bytes

export const encrypt = (text) => {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Store IV along with encrypted string so we can decrypt it dynamically
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error.message);
    return text; // Fallback to raw text to prevent crashing
  }
};

export const decrypt = (text) => {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) {
      // If it doesn't contain a colon, it's already plain text (or failed format)
      return text;
    }
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error.message);
    return text; // Return encrypted/original text if decryption fails
  }
};
