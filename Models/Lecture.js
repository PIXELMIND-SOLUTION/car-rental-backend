import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    title: { type: String, },
    description: { type: String, },
    date: { type: Date, },
    duration: { type: String, },
    link: { type: String },
    class: { type: String, },
    section: { type: String, },
    subject: { type: String, },
}, { timestamps: true });

const Lecture = mongoose.model("Lecture", lectureSchema);

export default Lecture;
