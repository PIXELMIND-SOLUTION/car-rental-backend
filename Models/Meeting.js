import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const meetingSchema = new Schema({
  date: {
    type: Date,
  },
  time: {
    type: String,
  },
  agenda: {
    type: String,
  },
  location: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Meeting = model('Meeting', meetingSchema);

export default Meeting;
