// test_enhance_api.js
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwttokenkey987654321';

async function runDiagnostics() {
  console.log('--- AI API Diagnosis ---');
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-mini');
    
    console.log('Fetching a real user from database...');
    const realUser = await User.findOne();
    if (!realUser) {
      console.error('No users found in database! Register a user first.');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`Generating token for real user: ${realUser.name} (${realUser._id})`);
    const token = jwt.sign({ id: realUser._id.toString() }, JWT_SECRET, { expiresIn: '1d' });

    console.log('Calling /api/ai/enhance...');
    const response = await fetch('http://localhost:5000/api/ai/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message: 'hi' })
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);
    
    const json = await response.json();
    console.log('Response JSON:', JSON.stringify(json, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Diagnosis Fetch Error:', err);
    try { await mongoose.disconnect(); } catch(e) {}
  }
}

runDiagnostics();
