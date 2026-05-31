import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function clearDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-mini';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    console.log('Dropping the entire database...');
    await mongoose.connection.db.dropDatabase();
    
    console.log('Database dropped and cleared successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err.message);
    process.exit(1);
  }
}

clearDatabase();
