import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  rental: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rental',
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bkash', 'nagad', 'rocket', 'card', 'cash', 'sslcommerz'],
    required: true,
  },
  phoneNumber: {
    type: String,
    required: false, // Optional for SSLCommerz payments
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  gatewayResponse: {
    method: String,
    transactionId: String,
    verified: Boolean,
    timestamp: Date,
    errorMessage: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundReason: {
    type: String,
  },
  refundedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ rental: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment; 