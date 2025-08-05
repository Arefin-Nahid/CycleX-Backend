import { db } from '../config/firebase.js';
import Cycle from '../models/Cycle.js';
import mongoose from 'mongoose';

class MongoFirebaseSync {
  constructor() {
    this.isWatching = false;
    this.changeStream = null;
  }

  /**
   * Start real-time syncing between MongoDB and Firebase
   */
  async startSync() {
    try {
      if (!db) {
        console.warn('Firebase not configured. Real-time sync disabled.');
        return;
      }

      if (this.isWatching) {
        console.log('Real-time sync already running...');
        return;
      }

      console.log('Starting real-time MongoDB to Firebase sync...');

      // Create change stream to watch for changes in Cycle collection
      this.changeStream = Cycle.watch([
        {
          $match: {
            $or: [
              { 'updateDescription.updatedFields.isRented': { $exists: true } },
              { 'updateDescription.updatedFields.isActive': { $exists: true } },
              { 'updateDescription.updatedFields.coordinates': { $exists: true } }
            ]
          }
        }
      ]);

      this.changeStream.on('change', async (change) => {
        try {
          const cycleId = change.documentKey._id.toString();
          const updatedFields = change.updateDescription?.updatedFields || {};
          
          console.log(`MongoDB Change Detected:`);
          console.log(`   Cycle ID: ${cycleId}`);
          console.log(`   Updated Fields:`, updatedFields);

          // Handle isRented changes (lock status)
          if (updatedFields.isRented !== undefined) {
            const isLocked = updatedFields.isRented ? 1 : 0;
            console.log(`   isRented: ${updatedFields.isRented} → isLocked: ${isLocked}`);
            await this.updateFirebaseLockStatus(cycleId, isLocked);
          }

          // Handle other field changes if needed
          if (updatedFields.isActive !== undefined || updatedFields.coordinates) {
            console.log(`   Additional fields updated:`, updatedFields);
            // You can add more Firebase updates here if needed
          }

        } catch (error) {
          console.error('Error processing MongoDB change:', error);
        }
      });

      this.changeStream.on('error', (error) => {
        console.error('Change stream error:', error);
        this.isWatching = false;
        // Attempt to restart sync after a delay
        setTimeout(() => {
          console.log('Attempting to restart real-time sync...');
          this.startSync();
        }, 5000);
      });

      this.changeStream.on('close', () => {
        console.log('Change stream closed');
        this.isWatching = false;
        // Attempt to restart sync after a delay
        setTimeout(() => {
          console.log('Attempting to restart real-time sync...');
          this.startSync();
        }, 5000);
      });

      this.isWatching = true;
      console.log('Real-time sync started successfully!');

    } catch (error) {
      console.error('Error starting real-time sync:', error);
      // Attempt to restart sync after a delay
      setTimeout(() => {
        console.log('Attempting to restart real-time sync...');
        this.startSync();
      }, 5000);
    }
  }

  /**
   * Stop real-time syncing
   */
  async stopSync() {
    try {
      if (this.changeStream) {
        await this.changeStream.close();
        this.changeStream = null;
      }
      this.isWatching = false;
      console.log('Real-time sync stopped');
    } catch (error) {
      console.error('Error stopping real-time sync:', error);
    }
  }

  /**
   * Update Firebase lock status
   */
  async updateFirebaseLockStatus(cycleId, isLocked) {
    try {
      if (!db) {
        console.warn('Firebase not configured. Cannot update lock status.');
        return;
      }

      console.log(`Updating Firebase lock status for cycle ${cycleId} to ${isLocked}`);
      
      const cycleRef = db.ref(`cycles/${cycleId}`);
      await cycleRef.set({
        isLocked: isLocked,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      });

      console.log(`Firebase: Successfully updated lock status for cycle ${cycleId} to ${isLocked === 1 ? 'LOCKED' : 'UNLOCKED'}`);
      
    } catch (error) {
      console.error(`Firebase: Error updating lock status for cycle ${cycleId}:`, error);
    }
  }

  /**
   * Initial sync - sync all current MongoDB data to Firebase
   */
  async initialSync() {
    try {
      console.log('Performing initial sync from MongoDB to Firebase...');
      
      if (!db) {
        console.error('Firebase not configured. Cannot perform initial sync.');
        return;
      }

      // Clear existing Firebase data first
      console.log('Clearing existing Firebase data...');
      const cyclesRef = db.ref('cycles');
      await cyclesRef.remove();
      console.log('Firebase data cleared');

      const cycles = await Cycle.find({});
      console.log(`Found ${cycles.length} real cycles in MongoDB for initial sync`);
      
      let syncedCount = 0;
      let errorCount = 0;
      
      for (const cycle of cycles) {
        try {
          const cycleId = cycle._id.toString();
          const isRented = cycle.isRented;
          const isLocked = isRented ? 1 : 0;
          
          console.log(`Initial sync: ${cycle.brand} ${cycle.model} - isRented=${isRented} → isLocked=${isLocked}`);
          
          await cyclesRef.child(cycleId).set({
            isLocked: isLocked,
            lastUpdated: new Date().toISOString(),
            timestamp: Date.now()
          });
          
          syncedCount++;
          console.log(`Successfully synced: ${cycle.brand} ${cycle.model}`);
          
        } catch (error) {
          errorCount++;
          console.error(`Error syncing cycle ${cycle._id}:`, error);
        }
      }
      
      console.log('Initial sync completed!');
      console.log(`Summary: ${syncedCount} synced, ${errorCount} errors`);
      
    } catch (error) {
      console.error('Error during initial sync:', error);
    }
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isWatching: this.isWatching,
      hasChangeStream: !!this.changeStream
    };
  }
}

// Create singleton instance
const mongoFirebaseSync = new MongoFirebaseSync();

export default mongoFirebaseSync; 