import { db } from '../config/firebase.js';

// Test cycle data
const testCycles = [
  {
    cycleId: "507f1f77bcf86cd799439011",
    data: {
      brand: "Giant",
      model: "Escape 3",
      owner: "test_owner_1",
      location: "KUET Campus, Khulna",
      hourlyRate: 15.0,
      isLocked: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  },
  {
    cycleId: "507f1f77bcf86cd799439012",
    data: {
      brand: "Trek",
      model: "FX 2",
      owner: "test_owner_2",
      location: "KUET Library Area",
      hourlyRate: 20.0,
      isLocked: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  },
  {
    cycleId: "507f1f77bcf86cd799439013",
    data: {
      brand: "Specialized",
      model: "Sirrus",
      owner: "test_owner_3",
      location: "KUET Engineering Building",
      hourlyRate: 25.0,
      isLocked: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  },
  {
    cycleId: "507f1f77bcf86cd799439014",
    data: {
      brand: "Cannondale",
      model: "Quick 6",
      owner: "test_owner_4",
      location: "KUET Student Center",
      hourlyRate: 18.0,
      isLocked: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  },
  {
    cycleId: "507f1f77bcf86cd799439015",
    data: {
      brand: "Scott",
      model: "Sub Sport",
      owner: "test_owner_5",
      location: "KUET Sports Complex",
      hourlyRate: 22.0,
      isLocked: 0,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    }
  }
];

async function insertTestData() {
  try {
    console.log('🚀 Starting to insert test data into Firebase...');
    
    if (!db) {
      console.error('❌ Firebase database not configured. Please set up Firebase first.');
      return;
    }

    const cyclesRef = db.ref('cycles');
    
    for (const cycle of testCycles) {
      console.log(`📝 Inserting cycle: ${cycle.cycleId}`);
      
      await cyclesRef.child(cycle.cycleId).set(cycle.data);
      
      console.log(`✅ Successfully inserted cycle: ${cycle.cycleId}`);
    }
    
    console.log('🎉 All test data inserted successfully!');
    console.log(`📊 Total cycles inserted: ${testCycles.length}`);
    
    // Verify the data was inserted
    const snapshot = await cyclesRef.once('value');
    const data = snapshot.val();
    console.log('📋 Current Firebase data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
}

// Run the script
insertTestData(); 