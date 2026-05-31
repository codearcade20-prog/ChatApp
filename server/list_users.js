// list_users.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function listUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-mini';
    console.log('Connecting to:', mongoUri.split('@').pop()); // Hide credentials in log
    await mongoose.connect(mongoUri);
    
    const users = await User.find().select('-password');
    console.log('--- Registered Users in Database ---');
    console.log(JSON.stringify(users, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error listing users:', err.message);
  }
}

listUsers();
