import { Schema, model } from 'mongoose';

const cycleSchema = new Schema({
  owner: {
    type: String,  // Firebase UID
    required: true,
    ref: 'User'
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  condition: {
    type: String,
    required: true,
    enum: ['Excellent', 'Good', 'Fair'],
    default: 'Good'
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  isRented: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  images: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

cycleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Cycle = model('Cycle', cycleSchema);

export default Cycle; 