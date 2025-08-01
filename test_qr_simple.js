import fetch from 'node-fetch';

const BASE_URL = 'https://cycle-x-backend.vercel.app/api';
const TEST_CYCLE_ID = '507f1f77bcf86cd799439011'; // Replace with a real cycle ID from your database

// Test QR code generation
async function testQRGeneration() {
  console.log('🧪 Testing QR Code Generation...');
  
  try {
    const response = await fetch(`${BASE_URL}/qr/code/${TEST_CYCLE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your Firebase ID token here for testing
        'Authorization': 'Bearer YOUR_FIREBASE_ID_TOKEN'
      }
    });

    const data = await response.json();
    console.log('✅ QR Generation Response:', data);
    
    if (data.qrData) {
      console.log('📱 QR Code Data:', data.qrData);
      console.log('🔗 You can generate a QR code with this data:', data.qrData);
    }
  } catch (error) {
    console.error('❌ QR Generation Error:', error.message);
  }
}

// Test cycle details retrieval
async function testGetCycleById() {
  console.log('\n🧪 Testing Get Cycle By ID...');
  
  try {
    const response = await fetch(`${BASE_URL}/cycles/${TEST_CYCLE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your Firebase ID token here for testing
        'Authorization': 'Bearer YOUR_FIREBASE_ID_TOKEN'
      }
    });

    const data = await response.json();
    console.log('✅ Get Cycle Response:', data);
  } catch (error) {
    console.error('❌ Get Cycle Error:', error.message);
  }
}

// Test QR validation
async function testQRValidation() {
  console.log('\n🧪 Testing QR Validation...');
  
  try {
    const response = await fetch(`${BASE_URL}/qr/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your Firebase ID token here for testing
        'Authorization': 'Bearer YOUR_FIREBASE_ID_TOKEN'
      },
      body: JSON.stringify({
        qrString: JSON.stringify({
          cycleId: TEST_CYCLE_ID,
          brand: 'Test Brand',
          model: 'Test Model',
          hourlyRate: 5.00,
          location: 'Test Location'
        })
      })
    });

    const data = await response.json();
    console.log('✅ QR Validation Response:', data);
  } catch (error) {
    console.error('❌ QR Validation Error:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting QR Functionality Tests...\n');
  
  await testQRGeneration();
  await testGetCycleById();
  await testQRValidation();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Replace YOUR_FIREBASE_ID_TOKEN with a real token');
  console.log('2. Replace TEST_CYCLE_ID with a real cycle ID from your database');
  console.log('3. Generate QR codes with the returned data');
  console.log('4. Test scanning with your Flutter app');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 