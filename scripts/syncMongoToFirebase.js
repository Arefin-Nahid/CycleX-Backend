import { db } from '../config/firebase.js';
import Cycle from '../models/Cycle.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function syncMongoToFirebase() {
  try {
    console.log('🔄 Starting to sync MongoDB isRented values with Firebase isLocked values...');
    
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
      const isRented = cycle.isRented;
      const isLocked = isRented ? 1 : 0;
      
      console.log(`🔄 Syncing cycle: ${cycleId}`);
      console.log(`   MongoDB isRented: ${isRented}`);
      console.log(`   Firebase isLocked: ${isLocked}`);
      
      await cyclesRef.child(cycleId).set({
        isLocked: isLocked,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      });
      
      console.log(`✅ Successfully synced cycle: ${cycleId} (${isRented ? 'LOCKED' : 'UNLOCKED'})`);
    }
    
    console.log('🎉 All cycles synced successfully!');
    console.log(`📊 Total cycles processed: ${cycles.length}`);
    
    // Verify the data was synced correctly
    const snapshot = await cyclesRef.once('value');
    const data = snapshot.val();
    console.log('📋 Current Firebase sync data:', JSON.stringify(data, null, 2));
    
    // Show summary
    console.log('\n📊 SYNC SUMMARY:');
    for (const cycle of cycles) {
      const cycleId = cycle._id.toString();
      const firebaseData = data[cycleId];
      console.log(`   ${cycle.brand} ${cycle.model}: MongoDB isRented=${cycle.isRented} → Firebase isLocked=${firebaseData?.isLocked}`);
    }
    
  } catch (error) {
    console.error('❌ Error syncing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the sync
syncMongoToFirebase(); 