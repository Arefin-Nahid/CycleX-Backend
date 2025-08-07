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

// Fix specific payment that's stuck in pending
const fixSpecificPayment = async () => {
  try {
    console.log('🔧 Starting specific payment fix...');
    
    // The specific transaction ID from your MongoDB document
    const transactionId = 'CYCLEX_1754583682706_1rbti2i7l';
    
    // Find the specific payment
    const payment = await Payment.findOne({ transactionId: transactionId });
    
    if (!payment) {
      console.log('❌ Payment not found:', transactionId);
      return;
    }
    
    console.log('✅ Found payment:', {
      _id: payment._id,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    });
    
    // Update payment status to completed
    payment.status = 'completed';
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      verified: true,
      verifiedAt: new Date(),
      timestamp: new Date(),
      manuallyFixed: true,
      fixReason: 'Payment was stuck in pending status, manually completed'
    };
    payment.updatedAt = new Date();
    
    await payment.save();
    
    console.log('✅ Payment status updated to completed');
    
    // Update rental payment status
    const rental = await Rental.findById(payment.rental);
    if (rental) {
      rental.paymentStatus = 'paid';
      await rental.save();
      console.log('✅ Rental payment status updated to paid');
    } else {
      console.log('⚠️ Rental not found for payment:', payment.rental);
    }
    
    console.log('🎉 Specific payment fix completed');
    
  } catch (error) {
    console.error('Error fixing specific payment:', error);
  }
};

// Run the fix
const runFix = async () => {
  await connectDB();
  await fixSpecificPayment();
  console.log('✅ Specific payment fix completed');
  process.exit(0);
};

runFix();
