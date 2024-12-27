import mongoose from 'mongoose';

const examScheduleSchema = new mongoose.Schema({
  examTitle: {
    type: String,
  },
  class: {
    type: String,
  },
  section: {
    type: String,
  },
  subject: {
    type: String,
  },
  examDate: {
    type: Date,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  examType: {
    type: String,
    enum: ['Mid-Term', 'Final', 'Quiz', 'Unit Test'], // Enum for different exam types
    required: true,
},

}, { timestamps: true });

const Exam = mongoose.model('ExamSchedule', examScheduleSchema);

export default Exam;
