// Phone Call Schema
import mongoose from "mongoose";
const phoneCallSchema = new mongoose.Schema(
    {
      name: { type: String }, // Name of the person
      phone: { type: String, required: true }, // Phone number
      date: { type: Date, default: Date.now }, // Call date
      followUpDate: { type: Date }, // Follow-up date
      callDuration: { type: String }, // Duration of the call
      description: { type: String }, // Description of the call
      type: { type: String, enum: ['Incoming', 'Outgoing'], default: 'Incoming' }, // Call type
    },
    { timestamps: true }
  );
  
  const PhoneCallModel = mongoose.model('PhoneCall', phoneCallSchema);
  export default PhoneCallModel