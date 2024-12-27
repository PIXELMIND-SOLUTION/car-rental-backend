import asyncHandler from 'express-async-handler';
import Attendance from '../Models/Attendance';

const markAttendance = asyncHandler(async (req, res) => {
    const { studentId, date, status } = req.body;
    const attendance = new Attendance({ studentId, date, status });
    const createdAttendance = await attendance.save();
    res.status(201).json(createdAttendance);
});

const getAttendance = asyncHandler(async (req, res) => {
    const { studentId } = req.query;
    const attendanceRecords = await Attendance.find({ studentId });
    res.json(attendanceRecords);
});

export { markAttendance, getAttendance };
