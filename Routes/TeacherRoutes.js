import express from 'express'
const router = express.Router();

import { markAttendanceForClass, postMarksForStudent, addExamSchedule } from '../Controller/TeacherController.js';


router.post('/add-attendance', markAttendanceForClass);
router.post('/add-marks/:studentId', postMarksForStudent);
router.post('/exam-schedule', addExamSchedule);





export default router
