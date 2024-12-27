// Fee Schema
import mongoose from "mongoose";
const feeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    totalAmount: { type: Number },
    paidAmount: { type: Number, default: 0 },
    paymentHistory: [
      {
        date: { type: Date },
        amount: { type: Number }
      }
    ],
    role: { type: String, default: 'Admin' },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    feesGroup: {
      type: String,
    },
  
  }, { timestamps: true });
  
  const Fee = mongoose.model('Fee', feeSchema);
  export default Fee
