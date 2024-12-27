import mongoose from 'mongoose';

// Section Schema
const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Section name
    
  },
  { timestamps: true }
);

const SectionModel = mongoose.model('Section', sectionSchema);
export default SectionModel
