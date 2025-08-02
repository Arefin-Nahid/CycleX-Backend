import axios from 'axios';
import Rental from '../models/Rental.js';
import Payment from '../models/Payment.js';

// SSLCommerz Configuration
const SSLCOMMERZ_CONFIG = {
  store_id: 'cycle688e1a03bf406',
  store_password: 'cycle688e1a03bf406@ssl',
  sandbox: true, // Set to false for production
  base_url: 'https://sandbox.sslcommerz.com', // Change to https://securepay.sslcommerz.com for production
};

// Create SSLCommerz session
export const createSSLSession = async (req, res) => {
  try {
    const { rentalId, amount, customerInfo } = req.body;
    const userId = req.user.uid;

    console.log(`🔍 Creating SSL session for rental: ${rentalId}`);
    console.log(`💰 Amount: ${amount}`);

    // Find the rental
    const rental = await Rental.findById(rentalId).populate('cycle');
    if (!rental) {
      return res.status(404).json({
        message: 'Rental not found',
        error: 'RENTAL_NOT_FOUND',
      });
    }

    // Check if the user is authorized
    if (rental.renter !== userId) {
      return res.status(403).json({
        message: 'Not authorized to pay for this rental',
        error: 'FORBIDDEN',
      });
    }

    // Check if rental is completed
    if (rental.status !== 'completed') {
      return res.status(400).json({
        message: 'Cannot process payment for incomplete rental',
        error: 'INVALID_STATUS',
      });
    }

    // Validate amount
    const expectedAmount = parseFloat(rental.totalCost);
    const providedAmount = parseFloat(amount);
    
    if (Math.abs(expectedAmount - providedAmount) > 0.01) {
      return res.status(400).json({
        message: 'Payment amount does not match rental cost',
        error: 'INVALID_AMOUNT',
      });
    }

    // Generate unique transaction ID
    const transactionId = `CYCLEX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare SSLCommerz session data
    const sessionData = {
      store_id: SSLCOMMERZ_CONFIG.store_id,
      store_passwd: SSLCOMMERZ_CONFIG.store_password,
      total_amount: providedAmount,
      currency: 'BDT',
      tran_id: transactionId,
      product_category: 'Cycle Rental',
      cus_name: customerInfo?.name || 'CycleX User',
      cus_email: customerInfo?.email || 'user@cyclex.com',
      cus_add1: customerInfo?.address || 'Dhaka, Bangladesh',
      cus_city: customerInfo?.city || 'Dhaka',
      cus_postcode: customerInfo?.postcode || '1000',
      cus_country: 'Bangladesh',
      cus_phone: customerInfo?.phone || '01XXXXXXXXX',
      cus_fax: '',
      ship_name: customerInfo?.name || 'CycleX User',
      ship_add1: customerInfo?.address || 'Dhaka, Bangladesh',
      ship_city: customerInfo?.city || 'Dhaka',
      ship_postcode: customerInfo?.postcode || '1000',
      ship_country: 'Bangladesh',
      ship_phone: customerInfo?.phone || '01XXXXXXXXX',
      multi_card_name: '',
      value_a: rentalId, // Store rental ID
      value_b: userId, // Store user ID
      value_c: 'cycle_rental', // Store payment type
      value_d: rental.cycle?.brand || 'Unknown', // Store cycle brand
      var_1: rental.cycle?.model || 'Unknown', // Store cycle model
      var_2: rental.duration || 0, // Store rental duration
      var_3: rental.distance || 0, // Store rental distance
      var_4: rental.startTime, // Store start time
      var_5: rental.endTime, // Store end time
      success_url: `${req.protocol}://${req.get('host')}/api/payments/ssl/success`,
      fail_url: `${req.protocol}://${req.get('host')}/api/payments/ssl/fail`,
      cancel_url: `${req.protocol}://${req.get('host')}/api/payments/ssl/cancel`,
      ipn_url: `${req.protocol}://${req.get('host')}/api/payments/ssl/ipn`,
    };

    console.log('📤 Sending session request to SSLCommerz:', {
      store_id: sessionData.store_id,
      total_amount: sessionData.total_amount,
      tran_id: sessionData.tran_id,
    });

    // Create session with SSLCommerz
    const sslResponse = await axios.post(
      `${SSLCOMMERZ_CONFIG.base_url}/gwprocess/v4/api.php`,
      sessionData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    console.log('📥 SSLCommerz response:', sslResponse.data);

    if (sslResponse.data.status === 'VALID' || sslResponse.data.status === 'INVALID_TRANSACTION') {
      // Create pending payment record
      const payment = new Payment({
        rental: rentalId,
        user: userId,
        amount: providedAmount,
        paymentMethod: 'sslcommerz',
        transactionId: transactionId,
        status: 'pending',
        gatewayResponse: {
          sessionId: sslResponse.data.sessionkey,
          gatewayUrl: sslResponse.data.GatewayPageURL,
          status: sslResponse.data.status,
          timestamp: new Date(),
        },
      });

      await payment.save();

      // Update rental with payment reference
      rental.paymentId = payment._id;
      await rental.save();

      res.json({
        message: 'SSL session created successfully',
        session: {
          sessionId: sslResponse.data.sessionkey,
          gatewayUrl: sslResponse.data.GatewayPageURL,
          transactionId: transactionId,
        },
        payment: {
          _id: payment._id,
          amount: payment.amount,
          status: payment.status,
        },
      });
    } else {
      throw new Error(`SSLCommerz session creation failed: ${sslResponse.data.status}`);
    }

  } catch (error) {
    console.error('❌ Error creating SSL session:', error);
    res.status(500).json({
      message: 'Error creating payment session',
      error: error.message,
    });
  }
};

// SSLCommerz success callback
export const sslSuccess = async (req, res) => {
  try {
    const { tran_id, val_id, amount, currency, bank_tran_id, store_amount, card_type, card_no, card_issuer, card_brand, card_sub_brand, card_issuer_country, card_issuer_country_code, store_id, verify_sign, verify_key, base_fair, value_a, value_b, value_c, value_d } = req.body;

    console.log('✅ SSL Success callback received:', { tran_id, val_id, amount });

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (!payment) {
      console.error('❌ Payment not found for transaction:', tran_id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify the payment with SSLCommerz
    const verificationData = {
      val_id: val_id,
      store_id: SSLCOMMERZ_CONFIG.store_id,
      store_passwd: SSLCOMMERZ_CONFIG.store_password,
    };

    const verifyResponse = await axios.post(
      `${SSLCOMMERZ_CONFIG.base_url}/validator/api/validationserverAPI.php`,
      verificationData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    console.log('🔍 SSL verification response:', verifyResponse.data);

    if (verifyResponse.data.status === 'VALID' || verifyResponse.data.status === 'VALIDATED') {
      // Update payment status
      payment.status = 'completed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        valId: val_id,
        bankTranId: bank_tran_id,
        cardType: card_type,
        cardNo: card_no,
        cardIssuer: card_issuer,
        cardBrand: card_brand,
        verified: true,
        verifiedAt: new Date(),
      };
      await payment.save();

      // Update rental payment status
      const rental = await Rental.findById(payment.rental);
      if (rental) {
        rental.paymentStatus = 'paid';
        await rental.save();
      }

      console.log('✅ Payment verified and completed successfully');

      // Serve success HTML page
      res.sendFile('public/payment-success.html', { root: '.' });
    } else {
      console.error('❌ Payment verification failed:', verifyResponse.data);
      res.sendFile('public/payment-failed.html', { root: '.' });
    }

  } catch (error) {
    console.error('❌ Error in SSL success callback:', error);
    res.sendFile('public/payment-failed.html', { root: '.' });
  }
};

// SSLCommerz fail callback
export const sslFail = async (req, res) => {
  try {
    const { tran_id, error } = req.body;
    console.log('❌ SSL Fail callback received:', { tran_id, error });

    // Find and update payment status
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (payment) {
      payment.status = 'failed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        error: error,
        failedAt: new Date(),
      };
      await payment.save();
    }

    res.sendFile('public/payment-failed.html', { root: '.' });
  } catch (error) {
    console.error('❌ Error in SSL fail callback:', error);
    res.sendFile('public/payment-failed.html', { root: '.' });
  }
};

// SSLCommerz cancel callback
export const sslCancel = async (req, res) => {
  try {
    const { tran_id } = req.body;
    console.log('🚫 SSL Cancel callback received:', { tran_id });

    // Find and update payment status
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (payment) {
      payment.status = 'cancelled';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        cancelledAt: new Date(),
      };
      await payment.save();
    }

    res.sendFile('public/payment-failed.html', { root: '.' });
  } catch (error) {
    console.error('❌ Error in SSL cancel callback:', error);
    res.sendFile('public/payment-failed.html', { root: '.' });
  }
};

// SSLCommerz IPN (Instant Payment Notification)
export const sslIPN = async (req, res) => {
  try {
    const { tran_id, val_id, amount, currency, bank_tran_id, store_amount, card_type, card_no, card_issuer, card_brand, card_sub_brand, card_issuer_country, card_issuer_country_code, store_id, verify_sign, verify_key, base_fair, value_a, value_b, value_c, value_d } = req.body;

    console.log('📡 SSL IPN received:', { tran_id, val_id, amount });

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transactionId: tran_id });
    if (!payment) {
      console.error('❌ Payment not found for IPN:', tran_id);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify the payment
    const verificationData = {
      val_id: val_id,
      store_id: SSLCOMMERZ_CONFIG.store_id,
      store_passwd: SSLCOMMERZ_CONFIG.store_password,
    };

    const verifyResponse = await axios.post(
      `${SSLCOMMERZ_CONFIG.base_url}/validator/api/validationserverAPI.php`,
      verificationData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      }
    );

    if (verifyResponse.data.status === 'VALID' || verifyResponse.data.status === 'VALIDATED') {
      // Update payment status if not already completed
      if (payment.status !== 'completed') {
        payment.status = 'completed';
        payment.gatewayResponse = {
          ...payment.gatewayResponse,
          valId: val_id,
          bankTranId: bank_tran_id,
          cardType: card_type,
          cardNo: card_no,
          cardIssuer: card_issuer,
          cardBrand: card_brand,
          verified: true,
          verifiedAt: new Date(),
        };
        await payment.save();

        // Update rental payment status
        const rental = await Rental.findById(payment.rental);
        if (rental) {
          rental.paymentStatus = 'paid';
          await rental.save();
        }

        console.log('✅ Payment verified via IPN');
      }

      res.json({ status: 'success' });
    } else {
      console.error('❌ IPN verification failed:', verifyResponse.data);
      res.status(400).json({ status: 'failed', message: 'Verification failed' });
    }

  } catch (error) {
    console.error('❌ Error in SSL IPN:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Get SSL payment status
export const getSSLPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.uid;

    const payment = await Payment.findOne({ 
      transactionId: transactionId,
      user: userId 
    }).populate('rental');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
        error: 'PAYMENT_NOT_FOUND',
      });
    }

    res.json({
      payment: {
        _id: payment._id,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        gatewayResponse: payment.gatewayResponse,
        rental: payment.rental ? {
          _id: payment.rental._id,
          duration: payment.rental.duration,
          distance: payment.rental.distance,
          totalCost: payment.rental.totalCost,
        } : null,
      },
    });

  } catch (error) {
    console.error('Error fetching SSL payment status:', error);
    res.status(500).json({
      message: 'Error fetching payment status',
      error: error.message,
    });
  }
}; 