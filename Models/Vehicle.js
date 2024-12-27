import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
  },
  vehicleModel: {
    type: String,
  },
  yearMade: {
    type: Number,
  },
  driver: {
    type: String,  // Assuming driver is selected by name or ID
  },
  note: {
    type: String,
  }
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
