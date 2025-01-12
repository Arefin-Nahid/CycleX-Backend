import { Schema, model } from 'mongoose';

const cycleSchema = new Schema({
  owner: {
    type: String,  // Firebase UID of the owner
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
  images: [{
    type: String,  // URLs to images
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

// Update timestamp on save
cycleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Cycle = model('Cycle', cycleSchema);

export default Cycle; 