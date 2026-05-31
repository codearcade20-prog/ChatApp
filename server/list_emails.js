// list_emails.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    console.log('=== Registered User Emails ===');
    for (const u of users) {
      console.log(`- ${u.name}: Email="${u.email}" Phone="${u.phone}"`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err.message);
  }
}
run();
