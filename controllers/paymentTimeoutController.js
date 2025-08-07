import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

// Payment timeout configuration (in minutes)
const PAYMENT_TIMEOUT_MINUTES = 30; // 30 minutes to complete payment
const GRACE_PERIOD_MINUTES = 15; // 15 minutes grace period after timeout

// Check for unpaid rentals and handle timeouts
export const checkPaymentTimeouts = async () => {
  try {
    console.log('🔍 Checking for payment timeouts...');
    
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - (PAYMENT_TIMEOUT_MINUTES * 60 * 1000));
    
    // Find completed rentals with pending payments that have exceeded timeout
    const unpaidRentals = await Rental.find({
      status: 'completed',
      paymentStatus: 'pending',
      updatedAt: { $lt: timeoutThreshold }
    }).populate('cycle');
    
    console.log(`Found ${unpaidRentals.length} unpaid rentals exceeding timeout`);
    
    for (const rental of unpaidRentals) {
      await handleUnpaidRental(rental);
    }
    
    return unpaidRentals.length;
  } catch (error) {
    console.error('Error checking payment timeouts:', error);
    throw error;
  }
};

// Handle individual unpaid rental
const handleUnpaidRental = async (rental) => {
  try {
    console.log(`Processing unpaid rental: ${rental._id}`);
    
    // Update rental payment status to failed
    rental.paymentStatus = 'failed';
    await rental.save();
    
    // Find associated payment record
    const payment = await Payment.findOne({ rental: rental._id });
    if (payment && payment.status === 'pending') {
      payment.status = 'failed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        errorMessage: 'Payment timeout - user did not complete payment within allowed time',
        timeoutAt: new Date(),
      };
      await payment.save();
    }
    
    // Send notification to user (implement based on your notification system)
    await sendPaymentTimeoutNotification(rental);
    
    // Update cycle availability
    if (rental.cycle) {
      rental.cycle.isRented = false;
      await rental.cycle.save();
    }
    
    console.log(`✅ Unpaid rental ${rental._id} processed successfully`);
    
  } catch (error) {
    console.error(`Error handling unpaid rental ${rental._id}:`, error);
  }
};

// Send payment timeout notification
const sendPaymentTimeoutNotification = async (rental) => {
  try {
    // This would integrate with your notification system (Firebase, email, SMS, etc.)
    console.log(`📧 Sending payment timeout notification to user: ${rental.renter}`);
    
    // Example notification data
    const notificationData = {
      userId: rental.renter,
      title: 'Payment Timeout',
      message: `Your payment for rental ${rental._id} has timed out. Please complete payment within ${GRACE_PERIOD_MINUTES} minutes to avoid penalties.`,
      type: 'payment_timeout',
      rentalId: rental._id,
      amount: rental.totalCost,
    };
    
    // TODO: Implement actual notification sending
    // await sendNotification(notificationData);
    
  } catch (error) {
    console.error('Error sending payment timeout notification:', error);
  }
};

// Get unpaid rentals for admin dashboard
export const getUnpaidRentals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {
      status: 'completed',
      paymentStatus: { $in: ['pending', 'failed'] }
    };
    
    if (status === 'pending') {
      query.paymentStatus = 'pending';
    } else if (status === 'failed') {
      query.paymentStatus = 'failed';
    }
    
    const unpaidRentals = await Rental.find(query)
      .populate('cycle')
      .populate('owner', 'displayName email')
      .populate('renter', 'displayName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Rental.countDocuments(query);
    
    res.json({
      unpaidRentals,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching unpaid rentals:', error);
    res.status(500).json({
      message: 'Error fetching unpaid rentals',
      error: error.message
    });
  }
};

// Manual payment timeout handling (admin function)
export const forcePaymentTimeout = async (req, res) => {
  try {
    const { rentalId } = req.params;
    
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND'
      });
    }
    
    if (rental.paymentStatus === 'paid') {
      return res.status(400).json({
        message: 'Rental is already paid',
        error: 'ALREADY_PAID'
      });
    }
    
    await handleUnpaidRental(rental);
    
    res.json({
      message: 'Payment timeout applied successfully',
      rental: {
        _id: rental._id,
        paymentStatus: rental.paymentStatus,
        totalCost: rental.totalCost
      }
    });
    
  } catch (error) {
    console.error('Error forcing payment timeout:', error);
    res.status(500).json({
      message: 'Error applying payment timeout',
      error: error.message
    });
  }
};

// Retry payment for failed rental
export const retryPayment = async (req, res) => {
  try {
    const { rentalId } = req.params;
    const userId = req.user.uid;
    
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND'
      });
    }
    
    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to retry payment for this rental',
        error: 'FORBIDDEN'
      });
    }
    
    if (rental.paymentStatus === 'paid') {
      return res.status(400).json({
        message: 'Rental is already paid',
        error: 'ALREADY_PAID'
      });
    }
    
    // Reset payment status to pending
    rental.paymentStatus = 'pending';
    await rental.save();
    
    // Delete old failed payment record if exists
    await Payment.deleteMany({ 
      rental: rentalId, 
      status: 'failed' 
    });
    
    res.json({
      message: 'Payment retry enabled',
      rental: {
        _id: rental._id,
        paymentStatus: rental.paymentStatus,
        totalCost: rental.totalCost
      }
    });
    
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      message: 'Error retrying payment',
      error: error.message
    });
  }
};

// Get payment timeout statistics
export const getPaymentTimeoutStats = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const stats = await Rental.aggregate([
      {
        $match: {
          status: 'completed',
          paymentStatus: { $in: ['pending', 'failed'] }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalCost' }
        }
      }
    ]);
    
    const recentTimeouts = await Rental.countDocuments({
      status: 'completed',
      paymentStatus: 'failed',
      updatedAt: { $gte: last24Hours }
    });
    
    res.json({
      stats,
      recentTimeouts,
      totalUnpaid: stats.reduce((sum, stat) => sum + stat.count, 0),
      totalUnpaidAmount: stats.reduce((sum, stat) => sum + stat.totalAmount, 0)
    });
    
  } catch (error) {
    console.error('Error fetching payment timeout stats:', error);
    res.status(500).json({
      message: 'Error fetching payment timeout statistics',
      error: error.message
    });
  }
}; 