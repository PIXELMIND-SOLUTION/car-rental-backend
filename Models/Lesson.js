import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  class: {
    type: String,
  },
  subject: {
    type: String,
  },
  lessonName: {
    type: String,
  },
  section: {
    type: String,
  },
  title: { // New title field
    type: String,
  },
  postedBy: { // New title field
    type: String,
  }
},  { timestamps: true });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
