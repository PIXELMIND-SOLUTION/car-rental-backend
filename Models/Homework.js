import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  class: {
    type: String,
  },
  subject: {
    type: String,
  },
  section: {
    type: String,
  },
  homeworkDate: {
    type: Date,
  },
  submissionDate: {
    type: Date,
  },
  marks: {
    type: Number,
  },
  file: {
    type: String,  // Store file path or URL for the attached file
  },
  description: {
    type: String,
  }
}, { timestamps: true });

const Homework = mongoose.model('Homework', homeworkSchema);

export default Homework;
