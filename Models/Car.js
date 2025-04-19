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
    default: true, // true means available, false means booked/unavailable
  },
  carImage: {
    type: String, // URL to the image of the car
  },
  location: {
    type: String, // Car's location or rental center
  },
  carType: {
    type: String, // Type of car (e.g., Sedan, SUV, etc.)
  },
  fuel: {
    type: String, // Fuel type (e.g., Petrol, Diesel, Electric)
  },
  seats: {
    type: Number, // Number of seats in the car
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
