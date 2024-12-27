import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        subjectName: { type: String, },   // Name of the subject (e.g., "Math", "Science")
        teacher: { type: String, },       // Name of the teacher who teaches the subject
        subjectType: { type: String, },   // Type of the subject (e.g., "Theory", "Practical")
        class: { type: String, },     // Class to which the subject belongs (e.g., "10th")
        section: { type: String, },       // Section of the class (e.g., "A", "B")
        schedule: {                                     // Exam schedule for the subject (optional)
            examDate: { type: Date },
            examTime: { type: String },
        },
        description: {
            type: String,
            trim: true,
        },
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
        },
        subjectType: {
            type: String,
            enum: ['Theory', 'Practical'],
        },
        subjectCode: {
            type: String,
            trim: true,
        },
        class: { type: String },
        section: { type: String },
        subject: { type: String },
        teacher: { type: String },
    },
    {
        timestamps: true,
    }
);

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
