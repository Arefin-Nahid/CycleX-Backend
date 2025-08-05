import { db } from '../config/firebase.js';

async function cleanupFirebase() {
  try {
    console.log('🧹 Starting Firebase cleanup...');
    
    if (!db) {
      console.error('❌ Firebase database not configured.');
      return;
    }

    const cyclesRef = db.ref('cycles');
    
    // Remove all existing data
    await cyclesRef.remove();
    console.log('✅ Removed all existing Firebase data');
    
    console.log('🎉 Firebase cleanup completed!');
    console.log('📋 Firebase is now ready for lock status only');
    
  } catch (error) {
    console.error('❌ Error cleaning up Firebase:', error);
  }
}

// Run the cleanup
cleanupFirebase(); 