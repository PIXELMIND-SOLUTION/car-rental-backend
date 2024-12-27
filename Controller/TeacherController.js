import asyncHandler from 'express-async-handler';
import Teacher from '../Models/Teacher.js';
import Syllabus from '../Models/Syllabus.js';
import Topic from '../Models/Topic.js';
import Homework from '../Models/Homework.js';
import Attendance from '../Models/Attendance.js';
import Student from '../Models/Student.js';
import Marks from '../Models/Mark.js';
import Exam from '../Models/ExamShedule.js';
import multer from 'multer'

const getTeachers = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find();
    res.json(teachers);
});

const getTeacherById = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
    }
    res.json(teacher);
});

const createTeacher = asyncHandler(async (req, res) => {
    const { name, subject } = req.body;
    const teacher = new Teacher({ name, subject });
    const createdTeacher = await teacher.save();
    res.status(201).json(createdTeacher);
});

const updateTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
    }
    Object.assign(teacher, req.body);
    const updatedTeacher = await teacher.save();
    res.json(updatedTeacher);
});

const deleteTeacher = asyncHandler(async (req, res) => {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
    }
    await teacher.remove();
    res.json({ message: 'Teacher removed' });
});

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Upload directory
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// POST Controller to create syllabus
const postSyllabus = async (req, res) => {
    try {
        const {
            syllabusTitle,
            syllabusType,
            availableFor,
            class: className,
            section,
            date,
            description,
        } = req.body;

        const newSyllabus = new Syllabus({
            syllabusTitle,
            syllabusType,
            availableFor,
            class: className,
            section,
            date,
            description,
            documentFile: req.file ? req.file.path : undefined,
        });
        await newSyllabus.save();

        res.status(201).json({ message: 'Syllabus created successfully.', data: newSyllabus });
    } catch (error) {
        res.status(500).json({ message: 'Error creating syllabus.', error: error.message });
    }
};

// GET Controller to retrieve syllabus
const getSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.find();

        res.status(200).json({ message: 'Syllabus retrieved successfully.', data: syllabus });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving syllabus.', error: error.message });
    }
};

// Controller function to add a new topic (POST)
 const addTopic = async (req, res) => {
    const { class: lessonClass, section, subject, lesson, topicName } = req.body;
  
    // Check if all required fields are provided
    if (!lessonClass || !section || !subject || !lesson || !topicName) {
      return res.status(400).json({ message: 'All fields (class, section, subject, lesson, topicName) are required' });
    }
  
    try {
      // Create a new topic
      const newTopic = new Topic({
        class: lessonClass,
        section: section,
        subject: subject,
        lesson: lesson,
        topicName: topicName
      });
  
      // Save the topic to the database
      await newTopic.save();
  
      // Return success response
      res.status(201).json({ message: 'Topic added successfully', topic: newTopic });
    } catch (error) {
      // Handle errors during save
      res.status(500).json({ message: 'Error adding topic', error: error.message });
    }
  };
  
  // Controller function to get all topics (GET)
   const getTopics = async (req, res) => {
    try {
      // Fetch all topics from the database
      const topics = await Topic.find().populate('lesson');  // Populate lesson details if needed
  
      // Return the topics
      res.status(200).json({ message: 'Topics retrieved successfully', topics });
    } catch (error) {
      // Handle errors during fetch
      res.status(500).json({ message: 'Error fetching topics', error: error.message });
    }
  };

// Controller function to add attendance record
 const addAttendance = async (req, res) => {
    const { admissionNumber, firstName, lastName, dateOfBirth, gender, attendanceStatus } = req.body;
  
    // Check if all required fields are provided
    if (!admissionNumber || !firstName || !lastName || !dateOfBirth || !gender || !attendanceStatus) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Create a new attendance record
      const newAttendance = new Attendance({
        admissionNumber,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        attendanceStatus
      });
  
      // Save the attendance record to the database
      await newAttendance.save();
  
      // Return success response
      res.status(201).json({ message: 'Attendance record added successfully', attendance: newAttendance });
    } catch (error) {
      // Handle errors during save
      res.status(500).json({ message: 'Error adding attendance record', error: error.message });
    }
  };

// Controller function to add homework
 const addHomework = async (req, res) => {
    const { class: homeworkClass, subject, section, homeworkDate, submissionDate, marks, attachment, description } = req.body;
  
    // Check if all required fields are provided
    if (!homeworkClass || !subject || !section || !homeworkDate || !submissionDate || !marks || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Create a new homework entry
      const newHomework = new Homework({
        class: homeworkClass,
        subject: subject,
        section: section,
        homeworkDate: homeworkDate,
        submissionDate: submissionDate,
        marks: marks,
        attachment: attachment,  // File URL or path
        description: description
      });
  
      // Save the homework to the database
      await newHomework.save();
  
      // Return success response
      res.status(201).json({ message: 'Homework added successfully', homework: newHomework });
    } catch (error) {
      // Handle errors during save
      res.status(500).json({ message: 'Error adding homework', error: error.message });
    }
  };

// Controller function to get all homework
 const getHomework = async (req, res) => {
    try {
      // Fetch all homework records from the database
      const homeworkRecords = await Homework.find();
  
      // Return the fetched homework data
      res.status(200).json({
        message: 'Homework records fetched successfully',
        homework: homeworkRecords
      });
    } catch (error) {
      // Handle errors during fetch
      res.status(500).json({ message: 'Error fetching homework records', error: error.message });
    }
  };

  const markAttendanceForClass = asyncHandler(async (req, res) => {
    const { class: className, section, date, attendanceStatus } = req.body;

    // Step 1: Fetch students based on class and section
    const students = await Student.find({ class: className, section });

    if (!students || students.length === 0) {
        return res.status(404).json({ message: "No students found for this class and section" });
    }

    // Step 2: Update attendance for each student
    const bulkUpdates = students.map(async (student) => {
        // Check if attendance for the specific date already exists
        const existingAttendance = student.attendance.find(
            (att) => att.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
        );

        if (existingAttendance) {
            // Update existing attendance
            existingAttendance.attendanceStatus = attendanceStatus;
        } else {
            // Add new attendance
            student.attendance.push({
                date,
                attendanceStatus,
            });
        }

        return student.save(); // Save updated student
    });

    // Wait for all updates to complete
    const results = await Promise.all(bulkUpdates);

    res.status(200).json({
        message: "Attendance updated successfully",
        updatedStudents: results,
    });
});


const postMarksForStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subject, marksObtained, totalMarks, examDate } = req.body;

  // Step 1: Create a new marks entry
  const newMark = new Marks({
      studentId,
      subject,
      marksObtained,
      totalMarks,
      examDate,
  });

  // Step 2: Save the marks to the database
  await newMark.save();

  res.status(201).json({
      message: "Marks added successfully",
      marks: newMark,
  });
});

const addExamSchedule = asyncHandler(async (req, res) => {
  const { class: className, section, subject, examDate, examTime, examType } = req.body;  // Get className, section, and other details from the request body

  // Step 1: Create a new exam schedule object for the Exam model
  const newExamSchedule = new Exam({
      class: className,
      section,
      subject,
      examDate,
      examTime,
      examType
  });

  // Step 2: Save the exam schedule to the database
  const createdExam = await newExamSchedule.save();

  // Step 3: Find all students in the specified class and section
  const students = await Student.find({ class: className, section: section });

  // Step 4: Push the exam schedule to each student's examSchedule array
  for (let student of students) {
      student.examSchedule.push({
          subject,
          examDate,
          examTime,
          examType
      });

      // Save the updated student document
      await student.save();
  }

  // Step 5: Respond with the newly created exam schedule
  res.status(201).json({
      message: "Exam schedule added successfully, and all students' schedules updated",
      exam: createdExam
  });
});



export { getTeachers,
     getTeacherById, 
     createTeacher, 
     updateTeacher, 
     deleteTeacher, 
     postSyllabus,
      getSyllabus,
      addTopic,
      getTopics,
      addAttendance,
      addHomework,
      getHomework,
      markAttendanceForClass,
      postMarksForStudent,
      addExamSchedule

     };
