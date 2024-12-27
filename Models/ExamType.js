import mongoose from 'mongoose';

const examTypeSchema = new mongoose.Schema({
  examName: {
    type: String,
  }
}, { timestamps: true });

const ExamType = mongoose.model('ExamType', examTypeSchema);

export default ExamType;
