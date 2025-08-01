// Test script for QR endpoints
// Run with: node test_qr_endpoints.js

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api'; // Change this to your backend URL
const TEST_CYCLE_ID = '507f1f77bcf86cd799439011'; // Replace with actual cycle ID from your database
const FIREBASE_TOKEN = 'your_firebase_token_here'; // Replace with actual Firebase token

// Test data for QR codes
const testQRData = {
  cycleId: TEST_CYCLE_ID,
  brand: 'Giant',
  model: 'Escape 3',
  hourlyRate: 5.00,
  location: 'KUET Campus',
  timestamp: new Date().toISOString()
};

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${FIREBASE_TOKEN}`
};

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) })
    };

    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting QR Endpoints Tests...\n');

  // Test 1: Get Cycle by ID (Public endpoint)
  console.log('='.repeat(50));
  console.log('TEST 1: Get Cycle by ID');
  console.log('='.repeat(50));
  await testEndpoint(`/cycles/${TEST_CYCLE_ID}`);

  // Test 2: Validate QR Data
  console.log('='.repeat(50));
  console.log('TEST 2: Validate QR Data');
  console.log('='.repeat(50));
  await testEndpoint('/qr/validate', 'POST', {
    qrData: JSON.stringify(testQRData)
  });

  // Test 3: Generate QR Data (requires authentication)
  console.log('='.repeat(50));
  console.log('TEST 3: Generate QR Data');
  console.log('='.repeat(50));
  await testEndpoint(`/qr/generate/${TEST_CYCLE_ID}`);

  // Test 4: Get QR Statistics (requires authentication)
  console.log('='.repeat(50));
  console.log('TEST 4: Get QR Statistics');
  console.log('='.repeat(50));
  await testEndpoint('/qr/stats');

  // Test 5: Rent Cycle by QR (requires authentication)
  console.log('='.repeat(50));
  console.log('TEST 5: Rent Cycle by QR');
  console.log('='.repeat(50));
  await testEndpoint('/cycles/rent-by-qr', 'POST', {
    cycleId: TEST_CYCLE_ID
  });

  console.log('\n✅ All tests completed!');
  console.log('\n📝 Notes:');
  console.log('- Tests 1 and 2 should work without authentication');
  console.log('- Tests 3, 4, and 5 require valid Firebase authentication');
  console.log('- Replace TEST_CYCLE_ID with an actual cycle ID from your database');
  console.log('- Replace FIREBASE_TOKEN with a valid Firebase ID token');
}

// Helper function to generate test QR codes
function generateTestQRData() {
  console.log('\n🎯 Test QR Code Data for Generation:');
  console.log('='.repeat(50));
  
  const testCases = [
    {
      name: 'Test Cycle 1',
      data: {
        cycleId: '507f1f77bcf86cd799439011',
        brand: 'Giant',
        model: 'Escape 3',
        hourlyRate: 5.00,
        location: 'KUET Campus',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Test Cycle 2',
      data: {
        cycleId: '507f1f77bcf86cd799439012',
        brand: 'Trek',
        model: 'FX 2',
        hourlyRate: 6.00,
        location: 'KUET Library',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Simple Cycle ID',
      data: '507f1f77bcf86cd799439011'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log(JSON.stringify(testCase.data, null, 2));
  });

  console.log('\n💡 Use any online QR code generator with this data');
  console.log('💡 Test with the CycleX app QR scanner');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--generate-qr')) {
    generateTestQRData();
  } else {
    runTests();
  }
}

export { testEndpoint, generateTestQRData }; 