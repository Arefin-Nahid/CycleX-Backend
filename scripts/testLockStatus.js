import { db } from '../config/firebase.js';
import FirebaseService from '../services/firebaseService.js';

async function testLockStatus() {
  try {
    console.log('🧪 Testing Firebase lock status functionality...');
    
    if (!db) {
      console.error('❌ Firebase database not configured.');
      return;
    }

    // Test cycle ID (use one of your existing MongoDB cycle IDs)
    const testCycleId = "688e68fa37926c05dd9e8282";
    
    console.log(`🔧 Testing with cycle ID: ${testCycleId}`);
    
    // Test 1: Get current lock status
    console.log('\n📋 Test 1: Getting current lock status...');
    const currentStatus = await FirebaseService.getCycleLockStatus(testCycleId);
    console.log('Current status:', currentStatus);
    
    // Test 2: Lock the cycle
    console.log('\n🔒 Test 2: Locking the cycle...');
    const lockResult = await FirebaseService.updateCycleLockStatus(testCycleId, 1);
    console.log('Lock result:', lockResult);
    
    // Test 3: Verify lock status
    console.log('\n📋 Test 3: Verifying lock status...');
    const lockedStatus = await FirebaseService.getCycleLockStatus(testCycleId);
    console.log('Locked status:', lockedStatus);
    
    // Test 4: Unlock the cycle
    console.log('\n🔓 Test 4: Unlocking the cycle...');
    const unlockResult = await FirebaseService.updateCycleLockStatus(testCycleId, 0);
    console.log('Unlock result:', unlockResult);
    
    // Test 5: Verify unlock status
    console.log('\n📋 Test 5: Verifying unlock status...');
    const unlockedStatus = await FirebaseService.getCycleLockStatus(testCycleId);
    console.log('Unlocked status:', unlockedStatus);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLockStatus(); 