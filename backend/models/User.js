const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google Auth
    },
    minlength: 6,
    select: false, // Don't return password by default
  },
  googleId: {
    type: String,
    sparse: true, // Allow multiple nulls if not set
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'pending'],
    default: 'employee',
  },
  avatar: {
    type: String,
    default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
  },
  department: {
    type: String,
  },
  designation: {
    type: String,
  },
  bio: {
    type: String,
  },
  phone: {
    type: String,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
