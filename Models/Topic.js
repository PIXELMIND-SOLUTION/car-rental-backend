import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  className: {
    type: String,
  },
  section: {
    type: String,
  },
  subject: {
    type: String,
  },
  lesson: {
    type: String,
  },
  topic: {
    type: String,
  },
}, { timestamps: true });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
