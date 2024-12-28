// Parent Schema
import mongoose from "mongoose";
const parentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  myStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }], // Array of student IDs
  role: { type: String, default: 'Parent' }
  }, { timestamps: true }
);
  
  const Parent = mongoose.model('Parent', parentSchema);
  export default Parent