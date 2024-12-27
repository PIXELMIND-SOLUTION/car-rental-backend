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
  title: { // New title field
    type: String,
  }
});

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;
