import QRCode from 'qrcode';
import fs from 'fs';

// Test cycle ID (replace with a real one from your database)
const TEST_CYCLE_ID = '507f1f77bcf86cd799439011';

// Generate simple QR code (just the cycle ID)
async function generateSimpleQR() {
  try {
    console.log('🔗 Generating simple QR code...');
    console.log('📱 QR Data:', TEST_CYCLE_ID);
    
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(TEST_CYCLE_ID);
    
    // Save to file
    fs.writeFileSync('test_qr_simple.png', qrDataURL.split(',')[1], 'base64');
    console.log('✅ Simple QR code saved as: test_qr_simple.png');
    
    return qrDataURL;
  } catch (error) {
    console.error('❌ Error generating simple QR:', error);
  }
}

// Generate JSON QR code
async function generateJSONQR() {
  try {
    console.log('🔗 Generating JSON QR code...');
    
    const qrData = {
      cycleId: TEST_CYCLE_ID,
      brand: 'Test Bike',
      model: 'Test Model',
      hourlyRate: 5.00,
      location: 'Test Location',
      timestamp: new Date().toISOString()
    };
    
    const qrString = JSON.stringify(qrData);
    console.log('📱 QR Data:', qrString);
    
    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(qrString);
    
    // Save to file
    fs.writeFileSync('test_qr_json.png', qrDataURL.split(',')[1], 'base64');
    console.log('✅ JSON QR code saved as: test_qr_json.png');
    
    return qrDataURL;
  } catch (error) {
    console.error('❌ Error generating JSON QR:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 QR Code Generator for Testing\n');
  
  await generateSimpleQR();
  console.log('');
  await generateJSONQR();
  
  console.log('\n📋 Instructions:');
  console.log('1. Use test_qr_simple.png for basic testing');
  console.log('2. Use test_qr_json.png for advanced testing');
  console.log('3. Make sure the cycle ID exists in your database');
  console.log('4. Test with your Flutter app');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateSimpleQR, generateJSONQR }; 