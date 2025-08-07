import app from './app.js';
import mongoFirebaseSync from './services/mongoFirebaseSync.js';
import paymentTimeoutService from './services/paymentTimeoutService.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start real-time MongoDB to Firebase sync
  try {
    console.log('Initializing real-time sync...');
    await mongoFirebaseSync.initialSync(); // Sync current data
    await mongoFirebaseSync.startSync(); // Start watching for changes
    console.log('Real-time sync initialized successfully!');
  } catch (error) {
    console.error('Error initializing real-time sync:', error);
  }
  
  // Start payment timeout monitoring service
  try {
    console.log('Starting payment timeout service...');
    paymentTimeoutService.start();
    console.log('Payment timeout service started successfully!');
  } catch (error) {
    console.error('Error starting payment timeout service:', error);
  }
});