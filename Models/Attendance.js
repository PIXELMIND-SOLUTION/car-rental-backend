import mongoose from "mongoose";

// Define the attendance schema
const attendanceSchema = new mongoose.Schema({
    date: { type: Date },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    admissionNumber: { type: String }, // Added admissionNumber
    firstName: { type: String }, // Added firstName
    lastName: { type: String }, // Added lastName
    dateOfBirth: { type: Date }, // Added dateOfBirth
    gender: { type: String, enum: ['Male', 'Female', 'Other'] }, // Added gender
    role: { type: String, default: 'Teacher' },
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Leave'],
        default: 'Absent'
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },
    date: {
        type: Date,
    },
    attendanceStatus: {
        type: String,
        enum: ['Present', 'Absent', 'Late'], // Add more statuses if needed
    },
    attendanceDate: { type: Date },

}, { timestamps: true });

// Create the Attendance model
const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
