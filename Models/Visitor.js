import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  purpose: {
    type: String,
  },
  name: {
    type: String,
  },
  phone: {
    type: String,
  },
  id: {
    type: String,
  },
  no_of_persons: {
    type: Number,
  },
  date: {
    type: Date,
  },
  in_time: {
    type: String,
  },
  out_time: {
    type: String,
  },
  file: {
    type: String,
  },
}, { timestamps: true });

const VisitorModel = mongoose.model('Visitor', visitorSchema);

export default VisitorModel;
