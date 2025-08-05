import app from './app.js';
import mongoFirebaseSync from './services/mongoFirebaseSync.js';

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
});