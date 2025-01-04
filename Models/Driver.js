import mongoose from "mongoose";

const DriverSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String},
    age: { type: Number },
    gender: { type: String },
    mobileNumber: { type: String },
    joiningDate: { type: Date },
  }, { timestamps: true });
  
const Driver = mongoose.model("Driver", DriverSchema);
export default Driver