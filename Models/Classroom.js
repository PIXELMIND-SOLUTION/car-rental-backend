// Classroom Schema
import mongoose from "mongoose";
const classroomSchema = new mongoose.Schema({
    roomNumber: { type: String },
    capacity: { type: Number },
    resources: { type: [String] },
    schedule: [
      {
        class: { type: String },
        subject: { type: String },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
        timeSlot: { type: String }
      }
    ],
    sections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section', // Reference to the Section model
    }],
    className: {
    type: String,
  },

    role: { type: String, default: 'Admin' }
  }, { timestamps: true });
  
  const Class = mongoose.model('Classroom', classroomSchema);
  export default Class