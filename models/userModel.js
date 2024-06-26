const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstname: { 
    type: String, 
    required: [true,'Please add firstname']
  },
  lastname: { 
    type: String, 
    // required: [true,'Please add lastname']
  },
  email: { 
    type: String, 
    required: [true,'Please add email address'],
    unique: [true,'Email address already exist'],
  },
  password: { 
    type: String, 
    // required: [true,'Please add password']
  }, 
  image: {
    type: String
  },
  bio: {
    type: String
  },
  verifyEmail: {
    type: Boolean,
    default: false
  },
  otp: {
    type:String
  },
  otpTimestamp: {
    type: Date,
  },

  },
  {
      timestamps:true
  }
  );

const User = mongoose.model('User', userSchema);

module.exports = User;