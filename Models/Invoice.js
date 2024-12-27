import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',  // Reference to the Student model
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  waiver: {
    type: Number,
    default: 0
  },
  fine: {
    type: Number,
    default: 0
  },
  paid: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: function() {
      return this.amount - (this.waiver + this.fine + this.paid);
    }
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
