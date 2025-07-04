import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    lowercase: true,
  },
  mobile: {
    type: String,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  myBookings: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
    },
  ],
  wallet: [
    {
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true,
      },
      message: {
        type: String,
        default: '',
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  totalWalletAmount: {
    type: Number,
    default: 0,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  points: {
    type: Number,
    default: 0,
  },
  code: {
    type: String,
    default: null,
  },
  profileImage: {
    type: String,
    default: 'default-profile-image.jpg',
  },

  // ✅ Moved location here (root level)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },

  notifications: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // automatic ObjectId generation
      message: String,
      type: String,
      date: { type: Date, default: Date.now },
    }
  ],

  documents: {
    aadharCard: {
      url: { type: String },
      uploadedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
    drivingLicense: {
      url: { type: String },
      uploadedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
  },
}, {
  timestamps: true,
});

// ✅ Geo Index for geospatial queries
userSchema.index({ location: '2dsphere' });

const User = mongoose.model('User', userSchema);

export default User;
