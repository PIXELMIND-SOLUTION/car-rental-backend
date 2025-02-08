import mongoose from "mongoose";

const { Schema, model } = mongoose;

const meetingSchema = new Schema(
  {
    meetingLink: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String, required: true },
    meetingTime: { type: Date, required: true }, // Stores both date and time
    subject: { type: String, required: true },
    agenda: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);

const Meeting = model("Meeting", meetingSchema);

export default Meeting;
