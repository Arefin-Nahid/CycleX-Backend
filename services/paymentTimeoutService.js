import cron from 'node-cron';
import { checkPaymentTimeouts } from '../controllers/paymentTimeoutController.js';

class PaymentTimeoutService {
  constructor() {
    this.isRunning = false;
  }

  // Start the payment timeout monitoring service
  start() {
    if (this.isRunning) {
      console.log('Payment timeout service is already running');
      return;
    }

    console.log('🚀 Starting payment timeout monitoring service...');

    // Check for payment timeouts every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('⏰ Running scheduled payment timeout check...');
        const timeoutCount = await checkPaymentTimeouts();
        
        if (timeoutCount > 0) {
          console.log(`✅ Processed ${timeoutCount} payment timeouts`);
        } else {
          console.log('✅ No payment timeouts found');
        }
      } catch (error) {
        console.error('❌ Error in scheduled payment timeout check:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Dhaka' // Adjust to your timezone
    });

    // Also run an immediate check on startup
    this.runImmediateCheck();

    this.isRunning = true;
    console.log('✅ Payment timeout service started successfully');
  }

  // Stop the payment timeout monitoring service
  stop() {
    if (!this.isRunning) {
      console.log('Payment timeout service is not running');
      return;
    }

    console.log('🛑 Stopping payment timeout monitoring service...');
    this.isRunning = false;
    console.log('✅ Payment timeout service stopped');
  }

  // Run an immediate check for payment timeouts
  async runImmediateCheck() {
    try {
      console.log('🔍 Running immediate payment timeout check...');
      const timeoutCount = await checkPaymentTimeouts();
      
      if (timeoutCount > 0) {
        console.log(`✅ Immediate check: Processed ${timeoutCount} payment timeouts`);
      } else {
        console.log('✅ Immediate check: No payment timeouts found');
      }
    } catch (error) {
      console.error('❌ Error in immediate payment timeout check:', error);
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date(),
      service: 'Payment Timeout Monitor'
    };
  }
}

// Create singleton instance
const paymentTimeoutService = new PaymentTimeoutService();

export default paymentTimeoutService; 