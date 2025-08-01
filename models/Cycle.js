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
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: function() {
        return this.isActive; // Require coordinates for active cycles
      }
    },
    // Keep backward compatibility with direct lat/lng fields
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

// Add geospatial index for location-based queries
cycleSchema.index({ 'coordinates': '2dsphere' });

// Add compound index for active and available cycles
cycleSchema.index({ isActive: 1, isRented: 1, 'coordinates.latitude': 1, 'coordinates.longitude': 1 });

cycleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Ensure coordinates are properly set for geospatial queries
  if (this.coordinates && this.coordinates.latitude && this.coordinates.longitude) {
    // Set GeoJSON coordinates for geospatial queries [longitude, latitude]
    if (!this.coordinates.coordinates || this.coordinates.coordinates.length !== 2) {
      this.coordinates.coordinates = [this.coordinates.longitude, this.coordinates.latitude];
    }
  }
  
  next();
});

const Cycle = model('Cycle', cycleSchema);

export default Cycle; 