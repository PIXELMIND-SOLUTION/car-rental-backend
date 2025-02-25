import mongoose from "mongoose";

const DemoSchema = new mongoose.Schema({
  fullName: { type: String, },
  email: { type: String, },
  phone: { type: String, },
  address: { type: String, },
  demoFor: { type: String, },
  demoDate: { type: String, }, // Date when the demo is scheduled
  demoTime: { type: String, }, // Time when the demo is scheduled
}, { timestamps: true });

const Demo = mongoose.model("Demo", DemoSchema);
export default Demo;
