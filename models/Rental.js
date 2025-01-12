const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  renterUID: {
    type: String,
    required: true
  },
  ownerUID: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Rental', rentalSchema); 