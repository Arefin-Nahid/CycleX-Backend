import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';

// Process payment
export const processPayment = async (req, res) => {
  try {
    const { rentalId, amount, paymentMethod, phoneNumber, transactionId } = req.body;
    const userId = req.user.uid;

    console.log(`Processing payment for rental: ${rentalId}`);
    console.log(`💰 Amount: ${amount}, Method: ${paymentMethod}`);

    // Find the rental
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if the user is authorized to pay for this rental
    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to pay for this rental',
        error: 'FORBIDDEN',
      });
    }

    // Check if the rental is completed
    if (rental.status !== 'completed') {
      return res.status(400).json({
        message: 'Cannot process payment for incomplete rental',
        error: 'INVALID_STATUS',
      });
    }

    // Validate payment amount
    const expectedAmount = parseFloat(rental.totalCost);
    const providedAmount = parseFloat(amount);
    
    if (Math.abs(expectedAmount - providedAmount) > 0.01) {
      return res.status(400).json({
        message: 'Payment amount does not match rental cost',
        error: 'INVALID_AMOUNT',
      });
    }

    // Simulate SSL gateway payment verification
    // In a real implementation, you would call the SSL gateway API here
    const isPaymentValid = await _verifyPaymentWithGateway(
      paymentMethod,
      phoneNumber,
      transactionId,
      amount
    );

    if (!isPaymentValid) {
      return res.status(400).json({
        message: 'Payment verification failed',
        error: 'PAYMENT_VERIFICATION_FAILED',
      });
    }

    // Create payment record
    const payment = new Payment({
      rental: rentalId,
      user: userId,
      amount: providedAmount,
      paymentMethod: paymentMethod,
      phoneNumber: phoneNumber,
      transactionId: transactionId,
      status: 'completed',
      gatewayResponse: {
        method: paymentMethod,
        transactionId: transactionId,
        verified: true,
        timestamp: new Date(),
      },
    });

    await payment.save();

    // Update rental payment status
    rental.paymentStatus = 'paid';
    rental.paymentId = payment._id;
    await rental.save();

          console.log(`Payment processed successfully for rental: ${rentalId}`);

    res.json({
      message: 'Payment processed successfully',
      payment: {
        _id: payment._id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      rental: {
        _id: rental._id,
        totalCost: rental.totalCost,
        paymentStatus: rental.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      message: 'Error processing payment',
      error: error.message,
    });
  }
};

// Verify payment with SSL gateway
async function _verifyPaymentWithGateway(method, phoneNumber, transactionId, amount) {
      console.log(`Verifying payment: Method=${method}, Phone=${phoneNumber}, TxnID=${transactionId}, Amount=${amount}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Payment validation logic
  if (!phoneNumber || !transactionId || !amount) {
          console.log('Payment verification failed: Missing required fields');
    return false;
  }

  // Validate phone number format (Bangladesh) - more lenient
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phoneNumber)) {
          console.log('Payment verification failed: Invalid phone number format');
    console.log(`Expected format: 01XXXXXXXXX, Got: ${phoneNumber}`);
    return false;
  }

  // Validate transaction ID format - more lenient
  if (transactionId.length < 6) {
          console.log('Payment verification failed: Transaction ID too short');
    console.log(`Expected: 6+ characters, Got: ${transactionId.length} characters`);
    return false;
  }

  // Validate amount
  if (amount <= 0) {
          console.log('Payment verification failed: Invalid amount');
    console.log(`Expected: > 0, Got: ${amount}`);
    return false;
  }

  // Simulate successful payment verification
        console.log('Payment verification successful');
  return true;
}

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.uid;

    const payments = await Payment.find({ user: userId })
      .populate('rental')
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedPayments = payments.map((payment) => ({
      _id: payment._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      status: payment.status,
      createdAt: payment.createdAt,
      rental: payment.rental ? {
        _id: payment.rental._id,
        duration: payment.rental.duration,
        distance: payment.rental.distance,
        totalCost: payment.rental.totalCost,
      } : null,
    }));

    res.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      message: 'Error fetching payment history',
      error: error.message,
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.uid;

    const payment = await Payment.findById(paymentId)
      .populate('rental');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND',
      });
    }

    // Check if the user is authorized to view this payment
    if (payment.user !== userId) {
      return res.status(403).json({
        message: 'Not authorized to view this payment',
        error: 'FORBIDDEN',
      });
    }

    res.json({
      payment: {
        _id: payment._id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.status,
        createdAt: payment.createdAt,
        rental: payment.rental ? {
          _id: payment.rental._id,
          duration: payment.rental.duration,
          distance: payment.rental.distance,
          totalCost: payment.rental.totalCost,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      message: 'Error fetching payment',
      error: error.message,
    });
  }
}; 