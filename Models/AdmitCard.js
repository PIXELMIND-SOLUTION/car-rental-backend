import mongoose from 'mongoose';

const admitCardSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student', // Assuming you have a Student model
    required: true
  },
  examTitle: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  admitCardGenerated: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const AdmitCard = mongoose.model('AdmitCard', admitCardSchema);

export default AdmitCard;
