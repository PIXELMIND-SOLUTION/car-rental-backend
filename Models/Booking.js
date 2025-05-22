import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
  },
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
  },
  rentalStartDate: {
    type: String,  // Store as string "YYYY-MM-DD"
  },
  rentalEndDate: {
    type: String,  // Store as string "YYYY-MM-DD"
  },
  from: {
    type: String,  // Store time in "hh:mm AM/PM" format
  },
  to: {
    type: String,  // Store time in "hh:mm AM/PM" format
  },
  deliveryDate: {
    type: String, // Store as string (e.g., "2025-09-01")
  },
  deliveryTime: {
    type: String, // Store time as string (e.g., "8:00 PM")
  },
  totalPrice: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'active'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'Paid'],
    default: 'pending',
  },
  pickupLocation: {
    type: {
      address: { type: String },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  dropLocation: {
    type: {
      address: { type: String },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  otp: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
