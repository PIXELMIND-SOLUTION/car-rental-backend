import mongoose from 'mongoose';

const { Schema } = mongoose;

const classRoutineSchema = new Schema({
  class: { type: String },  // removed 'required'
  section: { type: String },    // removed 'required'
  routine: [
    {
      day: { type: String },      // removed 'required'
      time: { type: String },     // removed 'required'
      subject: { type: String },  // removed 'required'
    },
  ],
});

const Routine = mongoose.model('ClassRoutine', classRoutineSchema);
export default Routine
