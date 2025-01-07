// Admin Schema
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, unique: true },
    password: { type: String },
role: {
    type: String,
    enum: ["Admin", "Teacher", "Student", "Parent"],
  },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
    parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
    classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
    fees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Fee' }],
    library: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }],
    schoolName: {
      type: String,
    },
    address: {
      type: String,
    },
    contact: {
      type: String,
    },
    email: {
      type: String,
    },
    description: {
      type: String,
    },
    logo: {
      type: String, // URL of the logo image stored in Cloudinary
    },
    schoolImage: {
      type: String, // URL of the school image stored in Cloudinary
    },
  }, { timestamps: true });
  
  const Admin = mongoose.model('Admin', adminSchema);
  export default Admin