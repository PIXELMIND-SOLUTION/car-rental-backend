// Parent Schema
import mongoose from "mongoose";
const parentSchema = new mongoose.Schema({
    fatherName: { type: String },
    motherName: { type: String },
    email: { type: String, unique: true },
    contactNumber: { type: String },
    address: { type: String },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    role: { type: String, default: 'Parent' }
  }, { timestamps: true });
  
  const Parent = mongoose.model('Parent', parentSchema);
  export default Parent