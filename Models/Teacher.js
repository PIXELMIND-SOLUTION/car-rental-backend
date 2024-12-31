// Teacher Schema
import mongoose from "mongoose";
const teacherSchema = new mongoose.Schema({
    name: { type: String },
    subject: { type: [String] },
    email: { type: String, unique: true },
    contactNumber: { type: String },
    class: { type: String },
    section: { type: String},
    teacher: { type: String },
    schedule: [
      {
        day: { type: String },
        time: { type: String },
        class: { type: String }
      }
    ],
    attendance: [
      {
        date: { type: Date },
        status: { type: String, enum: ['Present', 'Absent', 'On Leave'], default: 'Present' }
      }
    ],
    subjects: [
    {
      class: { type: String },
      section: { type: String },
      subject: { type: String },
    },
  ],
    role: { type: String, default: 'Teacher' }
  }, { timestamps: true });
  
  const Teacher = mongoose.model('Teacher', teacherSchema);
  export default Teacher