import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Rental from '../models/Rental.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cyclex');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix payment timeouts by updating timestamps for legitimate pending payments
const fixPaymentTimeouts = async () => {
  try {
    console.log('🔧 Starting payment timeout fix...');
    
    // Find all pending payments that might be legitimate
    const pendingPayments = await Payment.find({
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });
    
    console.log(`Found ${pendingPayments.length} pending payments`);
    
    let fixedCount = 0;
    
    for (const payment of pendingPayments) {
      // Update the timestamp to prevent timeout
      payment.updatedAt = new Date();
      await payment.save();
      fixedCount++;
      
      console.log(`✅ Fixed payment: ${payment.transactionId}`);
    }
    
    console.log(`🎉 Fixed ${fixedCount} payment timeouts`);
    
    // Also update rental timestamps
    const pendingRentals = await Rental.find({
      status: 'completed',
      paymentStatus: 'pending',
      updatedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) } // Older than 30 minutes
    });
    
    let fixedRentals = 0;
    
    for (const rental of pendingRentals) {
      rental.updatedAt = new Date();
      await rental.save();
      fixedRentals++;
      
      console.log(`✅ Fixed rental: ${rental._id}`);
    }
    
    console.log(`🎉 Fixed ${fixedRentals} rental timeouts`);
    
  } catch (error) {
    console.error('Error fixing payment timeouts:', error);
  }
};

// Run the fix
const runFix = async () => {
  await connectDB();
  await fixPaymentTimeouts();
  console.log('✅ Payment timeout fix completed');
  process.exit(0);
};

runFix();
