import { db } from '../config/firebase.js';

class FirebaseService {
  /**
   * Update the isLocked status of a cycle in Firebase Realtime Database
   * @param {string} cycleId - The cycle ID
   * @param {number} isLocked - 1 for locked, 0 for unlocked
   * @returns {Promise<Object>} - Result of the operation
   */
  static async updateCycleLockStatus(cycleId, isLocked) {
    try {
      if (!db) {
        console.warn('Firebase Realtime Database not configured. Skipping lock status update.');
        return {
          success: false,
          cycleId: cycleId,
          isLocked: isLocked,
          message: 'Firebase not configured - lock status not updated'
        };
      }

      console.log(`Firebase: Updating lock status for cycle ${cycleId} to ${isLocked}`);
      
      // Update ONLY the lock status in Firebase (minimal data)
      const cycleRef = db.ref(`cycles/${cycleId}`);
      await cycleRef.set({
        isLocked: isLocked,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      });

      console.log(`Firebase: Successfully updated lock status for cycle ${cycleId}`);
      
      return {
        success: true,
        cycleId: cycleId,
        isLocked: isLocked,
        message: `Cycle lock status updated to ${isLocked === 1 ? 'locked' : 'unlocked'}`
      };
    } catch (error) {
      console.error(`Firebase: Error updating lock status for cycle ${cycleId}:`, error);
      throw new Error(`Failed to update cycle lock status: ${error.message}`);
    }
  }

  /**
   * Get the current lock status of a cycle from Firebase Realtime Database
   * @param {string} cycleId - The cycle ID
   * @returns {Promise<Object>} - Current lock status
   */
  static async getCycleLockStatus(cycleId) {
    try {
      if (!db) {
        console.warn('Firebase Realtime Database not configured. Cannot get lock status.');
        return {
          success: false,
          cycleId: cycleId,
          message: 'Firebase not configured - cannot get lock status'
        };
      }

      console.log(`Firebase: Getting lock status for cycle ${cycleId}`);
      
      const cycleRef = db.ref(`cycles/${cycleId}`);
      const snapshot = await cycleRef.once('value');
      const data = snapshot.val();

      if (!data) {
        console.log(`Firebase: No data found for cycle ${cycleId}`);
        return {
          success: false,
          cycleId: cycleId,
          message: 'Cycle not found in Firebase'
        };
      }

      console.log(`Firebase: Retrieved lock status for cycle ${cycleId}:`, data);
      
      return {
        success: true,
        cycleId: cycleId,
        isLocked: data.isLocked || 0,
        lastUpdated: data.lastUpdated,
        timestamp: data.timestamp
      };
    } catch (error) {
      console.error(`Firebase: Error getting lock status for cycle ${cycleId}:`, error);
      throw new Error(`Failed to get cycle lock status: ${error.message}`);
    }
  }

  /**
   * Initialize a cycle in Firebase Realtime Database
   * @param {string} cycleId - The cycle ID
   * @param {Object} cycleData - Initial cycle data
   * @returns {Promise<Object>} - Result of the operation
   */
  static async initializeCycle(cycleId, cycleData = {}) {
    try {
      if (!db) {
        console.warn('Firebase Realtime Database not configured. Cannot initialize cycle.');
        return {
          success: false,
          cycleId: cycleId,
          message: 'Firebase not configured - cannot initialize cycle'
        };
      }

      console.log(`Firebase: Initializing lock status for cycle ${cycleId}`);
      
      const cycleRef = db.ref(`cycles/${cycleId}`);
      await cycleRef.set({
        isLocked: 0, // Default to unlocked
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      });

      console.log(`Firebase: Successfully initialized lock status for cycle ${cycleId}`);
      
      return {
        success: true,
        cycleId: cycleId,
        message: 'Cycle lock status initialized in Firebase'
      };
    } catch (error) {
      console.error(`Firebase: Error initializing cycle ${cycleId}:`, error);
      throw new Error(`Failed to initialize cycle: ${error.message}`);
    }
  }

  /**
   * Delete a cycle from Firebase Realtime Database
   * @param {string} cycleId - The cycle ID
   * @returns {Promise<Object>} - Result of the operation
   */
  static async deleteCycle(cycleId) {
    try {
      console.log(`Firebase: Deleting cycle ${cycleId} from Realtime Database`);
      
      const cycleRef = db.ref(`cycles/${cycleId}`);
      await cycleRef.remove();

      console.log(`Firebase: Successfully deleted cycle ${cycleId}`);
      
      return {
        success: true,
        cycleId: cycleId,
        message: 'Cycle deleted from Firebase Realtime Database'
      };
    } catch (error) {
      console.error(`Firebase: Error deleting cycle ${cycleId}:`, error);
      throw new Error(`Failed to delete cycle: ${error.message}`);
    }
  }

  /**
   * Get all cycles from Firebase Realtime Database
   * @returns {Promise<Object>} - All cycles data
   */
  static async getAllCycles() {
    try {
      console.log(`Firebase: Getting all cycles from Realtime Database`);
      
      const cyclesRef = db.ref('cycles');
      const snapshot = await cyclesRef.once('value');
      const data = snapshot.val();

      console.log(`Firebase: Retrieved ${Object.keys(data || {}).length} cycles`);
      
      return {
        success: true,
        cycles: data || {},
        count: Object.keys(data || {}).length
      };
    } catch (error) {
      console.error(`Firebase: Error getting all cycles:`, error);
      throw new Error(`Failed to get all cycles: ${error.message}`);
    }
  }
}

export default FirebaseService; 