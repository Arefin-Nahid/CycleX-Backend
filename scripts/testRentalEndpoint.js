import { db } from '../config/firebase.js';
import FirebaseService from '../services/firebaseService.js';

async function testRentalEndpoint() {
  try {
    console.log('🧪 Testing rental endpoint and Firebase integration...');
    
    if (!db) {
      console.error('❌ Firebase database not configured.');
      return;
    }

    // Test cycle ID (use one of your existing MongoDB cycle IDs)
    const testCycleId = "688e68fa37926c05dd9e8282";
    
    console.log(`🔧 Testing with cycle ID: ${testCycleId}`);
    
    // Test 1: Check initial lock status
    console.log('\n📋 Test 1: Checking initial lock status...');
    const initialStatus = await FirebaseService.getCycleLockStatus(testCycleId);
    console.log('Initial status:', initialStatus);
    
    // Test 2: Simulate rental process (lock the cycle)
    console.log('\n🔒 Test 2: Simulating rental process - locking cycle...');
    const lockResult = await FirebaseService.updateCycleLockStatus(testCycleId, 1);
    console.log('Lock result:', lockResult);
    
    // Test 3: Verify the lock status was updated
    console.log('\n📋 Test 3: Verifying lock status was updated...');
    const lockedStatus = await FirebaseService.getCycleLockStatus(testCycleId);
    console.log('Locked status:', lockedStatus);
    
    if (lockedStatus.isLocked === 1) {
      console.log('✅ SUCCESS: Cycle is now locked in Firebase!');
    } else {
      console.log('❌ FAILED: Cycle is not locked in Firebase!');
    }
    
    console.log('\n🎉 Test completed!');
    console.log('💡 If the test passed, the issue might be in the API call from your Flutter app.');
    console.log('💡 Check the backend server logs when you press "Start Rent" to see if the rental endpoint is being called.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testRentalEndpoint(); 