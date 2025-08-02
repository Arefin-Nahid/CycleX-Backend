import { Schema, model } from 'mongoose';

const rentalSchema = new Schema({
  cycle: {
    type: Schema.Types.ObjectId,
    ref: 'Cycle',
    required: true
  },
  renter: {
    type: String,  // Firebase UID of renter
    required: true,
    ref: 'User'
  },
  owner: {
    type: String,  // Firebase UID of owner
    required: true,
    ref: 'User'
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
    type: Number,  // in minutes
    required: true
  },
  distance: {
    type: Number,  // in kilometers
    default: 0
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
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
rentalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Rental = model('Rental', rentalSchema);

export default Rental; 