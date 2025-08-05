import { db } from '../config/firebase.js';
import Cycle from '../models/Cycle.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function initializeLockStatus() {
  try {
    console.log('🔧 Starting to initialize lock status for existing MongoDB cycles...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyclex');
    console.log('✅ Connected to MongoDB');
    
    if (!db) {
      console.error('❌ Firebase database not configured.');
      return;
    }

    // Get all cycles from MongoDB
    const cycles = await Cycle.find({});
    console.log(`📋 Found ${cycles.length} cycles in MongoDB`);
    
    const cyclesRef = db.ref('cycles');
    
    for (const cycle of cycles) {
      const cycleId = cycle._id.toString();
      console.log(`🔧 Initializing lock status for cycle: ${cycleId}`);
      
      await cyclesRef.child(cycleId).set({
        isLocked: 0, // Default to unlocked
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      });
      
      console.log(`✅ Successfully initialized lock status for cycle: ${cycleId}`);
    }
    
    console.log('🎉 All lock statuses initialized successfully!');
    console.log(`📊 Total cycles processed: ${cycles.length}`);
    
    // Verify the data was inserted
    const snapshot = await cyclesRef.once('value');
    const data = snapshot.val();
    console.log('📋 Current Firebase lock status data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error initializing lock status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
initializeLockStatus(); 