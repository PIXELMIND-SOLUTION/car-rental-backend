import mongoose from "mongoose";
const noticeSchema = mongoose.Schema(
    {
        title: { type: String, },
        description: { type: String, },
        date: { type: Date, default: Date.now },
        class: { type: String, }, // Optional: For class-specific notices
        section: { type: String, }, // Optional: For section-specific notices
        targetAudience: { type: [String], default: ["All"] }, // "All", "Class 10", etc.
        postedBy: { type: String, }  // Added 'postedBy' field
    },
    {
        timestamps: true
    }
);

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
