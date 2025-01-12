const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: [true, 'Firebase UID is required'],
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    validate: {
      validator: function(v) {
        return v.endsWith('@stud.kuet.ac.bd');
      },
      message: 'Email must be a valid KUET student email'
    }
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['renter', 'owner'],
    default: 'renter'
  },
  isProfileComplete: {
    type: Boolean,
    default: false
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate required fields
userSchema.pre('save', function(next) {
  if (!this.isProfileComplete && 
      this.studentId && 
      this.department && 
      this.phone && 
      this.address) {
    this.isProfileComplete = true;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User; 