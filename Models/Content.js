// Model (Assuming Mongoose is being used)
import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
    contentTitle: { type: String },
    contentType: { type: String },
    availableFor: { type: String, enum: ['All', 'Admin', 'Student', 'Class'] },
    class: { type: String },
    section: { type: String },
    date: { type: Date },
    description: { type: String },
    sourceURL: { type: String },
    documentFile: { type: String },
}, { timestamps: true });

const Content = mongoose.model('Content', ContentSchema);

export default Content;