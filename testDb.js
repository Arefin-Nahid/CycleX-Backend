require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection successful');
    
    // Test database operations
    const collections = await mongoose.connection.db.collections();
    console.log('Collections:', collections.map(c => c.collectionName));
    
    await mongoose.connection.close();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  }
}

testConnection(); 