import mongoose from 'mongoose';

const { Schema } = mongoose;

const carSchema = new Schema({
  carName: {
    type: String,
  },
  model: {
    type: String,
  },
  year: {
    type: Number,
  },
  pricePerHour: {
    type: Number,
  },
  description: {
    type: String,
  },
  availabilityStatus: {
    type: Boolean,
    default: true,
  },
   // ... other fields ...
  availability: [
    {
      date: {
        type: String,
      },
      timeSlots: [
        {
          type: String,
        },
      ],
    },
  ],
  carImage: {
    type: [String], // ✅ Array of image URLs
    default: [],    // ✅ Optional default to avoid null
  },
  location: {
    type: String,
  },
  carType: {
    type: String,
  },
  fuel: {
    type: String,
  },
  seats: {
    type: Number,
  },
  type: {
    type: String,
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

const Car = mongoose.model('Car', carSchema);
export default Car;
