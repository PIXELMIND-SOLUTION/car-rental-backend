import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Assuming you already have a User schema
    required: true,
  },
  carId: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  rentalStartDate: {
    type: Date,
    required: true,
  },
  rentalEndDate: {
    type: Date,
    required: true,
  },
  deliveryDate: {
  type: String, // or Date if you prefer, but for "just the date", String is simpler
},
deliveryTime: {
  type: String, // e.g., "12:00 PM"
},
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'active'],
    default: 'pending', // Status of the booking
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'Paid'],
    default: 'pending', // Payment status of the booking
  },
  pickupLocation: {
    type: {
      address: { type: String, },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
  },
  dropLocation: {
    type: {
      address: { type: String, },
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

const Booking =  mongoose.model('Booking', bookingSchema);
export default Booking
