const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema({
  ownerUID: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  description: String,
  hourlyRate: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'rented', 'maintenance', 'inactive'],
    default: 'available'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  images: [String],
  rating: {
    type: Number,
    default: 0
  },
  totalRentals: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for geospatial queries
cycleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Cycle', cycleSchema); 