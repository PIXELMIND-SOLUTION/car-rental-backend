// Model (Assuming Mongoose is being used)
import mongoose from 'mongoose';

const SyllabusSchema = new mongoose.Schema({
    syllabusTitle: { type: String, required: true },
    syllabusType: { type: String, required: true },
    availableFor: { type: String, enum: ['All', 'Admin', 'Student', 'Class'], required: true },
    class: { type: String },
    section: { type: String },
    date: { type: Date, required: true },
    description: { type: String },
    file: {
        type: String,  // Store file path or URL for the attached file
    },
}, { timestamps: true });

const Syllabus = mongoose.model('Syllabus', SyllabusSchema);
export default Syllabus