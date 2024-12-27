// Model (Assuming Mongoose is being used)
import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
    assignmentTitle: { type: String, },
    subject: { type: String, },
    availableFor: { type: String, enum: ['All', 'Admin', 'Student', 'Class'] },
    class: { type: String },
    section: { type: String },
    dueDate: { type: Date },
    description: { type: String },
    file: {
        type: String,  // Store file path or URL for the attached file
    },
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', AssignmentSchema);
export default Assignment
