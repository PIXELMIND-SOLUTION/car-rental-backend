import express from 'express'
const router = express.Router();

import {
    markAttendanceForStudent,
    postMarksForStudent,
    addExamSchedule,
    getStudentsAttendance,
    updateStudentAttendance,
    createHomework,
    getHomeworks,
    updateHomeworkStatus,
    getAllMarks,
    getClassRoutine,
    getAllLeaves,
    applyForLeave,
    getStudentsAdmission,
    fileComplaint,
    teacherLogin,
} from '../Controller/TeacherController.js';


router.post('/add-attendance/:studentId', markAttendanceForStudent);
router.post('/add-marks/:studentId', postMarksForStudent);
router.post('/exam-schedule', addExamSchedule);
router.get('/get-attendance', getStudentsAttendance);
router.put('/update-attendance/:studentId/:attendanceId', updateStudentAttendance);
router.post('/add-homework', createHomework);
router.get('/homeworks', getHomeworks);
router.put('/update-status/:homeworkId', updateHomeworkStatus);
router.get('/marks', getAllMarks);
router.get('/classroutine', getClassRoutine);
router.post('/apply-leave', applyForLeave);
router.get('/leaves', getAllLeaves);
router.get('/students', getStudentsAdmission);
router.post('/add-complaint/:studentId', fileComplaint);
router.post('/login', teacherLogin);



















export default router
