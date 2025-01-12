import { connect, connection } from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    await connect(process.env.MONGODB_URI);
    console.log('MongoDB connection successful');
    
    // Test database operations
    const collections = await connection.db.collections();
    console.log('Collections:', collections.map(c => c.collectionName));
    
    await connection.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  }
}

testConnection(); 