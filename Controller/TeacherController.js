import asyncHandler from 'express-async-handler';
import Teacher from '../Models/Teacher.js';
import Syllabus from '../Models/Syllabus.js';
import Topic from '../Models/Topic.js';
import Homework from '../Models/Homework.js';
import Attendance from '../Models/Attendance.js';
import Student from '../Models/Student.js';
import Marks from '../Models/Mark.js';
import Exam from '../Models/ExamShedule.js';
import Leave from '../Models/Leave.js';
import Routine from '../Models/Routine.js';
import ComplaintModel from '../Models/Complaint.js';
import generateRefreshToken from '../config/refreshtoken.js';
import generateToken from '../config/jwtToken.js';
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
    const { class: className, section, date, subject, attendanceStatus } = req.body;  // Add subject

    // Step 1: Fetch students based on class and section
    const students = await Student.find({ class: className, section });

    if (!students || students.length === 0) {
        return res.status(404).json({ message: "No students found for this class and section" });
    }

    // Step 2: Update attendance for each student
    const bulkUpdates = students.map(async (student) => {
        // Check if attendance for the specific date and subject already exists
        const existingAttendance = student.attendance.find(
            (att) => 
                att.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0] &&
                att.subject === subject  // Match by subject
        );

        if (existingAttendance) {
            // Update existing attendance for this subject and date
            existingAttendance.attendanceStatus = attendanceStatus;
        } else {
            // Add new attendance record with subject
            student.attendance.push({
                date,
                subject,  // Add subject to the attendance
                attendanceStatus,
            });
        }

        return student.save();  // Save updated student
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
  const { subject, marksObtained, totalMarks, examDate, examType } = req.body;

  // Step 1: Create a new marks entry
  const newMark = {
    subject,
    marksObtained,
    totalMarks,
    examDate,
    examType
  };

  // Step 2: Find the student by studentId
  const student = await Student.findById(studentId);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Step 3: Push the new marks into the student's marks array
  student.marks.push(newMark);

  // Step 4: Save the updated student document
  await student.save();

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


const getStudentsAttendance = async (req, res) => {
  try {
      const { class: studentClass, section, date, subject } = req.query;

      const students = await Student.find({ class: studentClass, section });
      const attendanceData = students.map((student) => {
          const todayRecord = student.attendance.find(
              (record) => record.date === date && record.subject === subject
          ) || { date, subject, attendanceStatus: 'Absent' };  // Use 'attendanceStatus' instead of 'status'

          return {
              id: student._id,
              name: student.firstName,
              class: student.class,
              section: student.section,
              attendance: todayRecord,
          };
      });

      res.status(200).json(attendanceData);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching attendance data', error });
  }
};

// Update attendance for a student
 const updateAttendance = async (req, res) => {
  try {
      const { studentId, date, attendanceStatus } = req.body;

      const student = await Student.findById(studentId);
      if (!student) {
          return res.status(404).json({ message: 'Student not found' });
      }

      const formattedDate = new Date(date).toISOString().split('T')[0];

      const existingRecord = student.attendance.find(
          (att) => att.date.toISOString().split('T')[0] === formattedDate
      );

      if (existingRecord) {
          existingRecord.attendanceStatus = attendanceStatus;
      } else {
          student.attendance.push({ date: new Date(date), attendanceStatus });
      }

      await student.save();
      res.status(200).json({ message: 'Attendance updated successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating attendance' });
  }
};

const updateStudentAttendance = async (req, res) => {
  try {
      const { studentId, attendanceId } = req.params; // Getting both studentId and attendanceId from params
      const { date, subject, attendanceStatus } = req.body;  // Changed 'status' to 'attendanceStatus'

      const student = await Student.findById(studentId);
      if (!student) {
          return res.status(404).json({ message: 'Student not found' });
      }

      // Find the specific attendance record by attendanceId
      const attendanceRecordIndex = student.attendance.findIndex(
          (record) => record._id.toString() === attendanceId
      );

      if (attendanceRecordIndex === -1) {
          return res.status(404).json({ message: 'Attendance record not found' });
      }

      // Update the attendance record
      student.attendance[attendanceRecordIndex].attendanceStatus = attendanceStatus;

      await student.save();
      res.status(200).json({ message: 'Attendance updated successfully', student });
  } catch (error) {
      res.status(500).json({ message: 'Error updating attendance', error });
  }
};


const createHomework = async (req, res) => {
  try {
      // Destructure data from request body
      const { class: studentClass, subject, section, homeworkDate, submissionDate, marks, file, description, homeworkTitle, teacherId } = req.body;

      // Create a new homework entry with homeworkTitle
      const newHomework = new Homework({
          class: studentClass,
          subject,
          section,
          homeworkDate,
          submissionDate,
          marks,
          description,
          homeworkTitle, // Include homeworkTitle
      });

      // Save the new homework entry to the database
      const savedHomework = await newHomework.save();

      // Find the teacher by ID and add the homework ID to assignedHomework array
      const teacher = await Teacher.findById(teacherId);

      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }

      // Add the newly created homework to the teacher's assignedHomework array
      teacher.assignedHomework.push(savedHomework._id);

      // Save the teacher with the updated assignedHomework field
      await teacher.save();

      // Send a success response
      res.status(201).json({
          message: 'Homework created successfully and assigned to teacher!',
          homework: savedHomework,
      });
  } catch (error) {
      // Handle any errors that occur during the process
      res.status(500).json({
          message: 'Error creating homework',
          error: error.message,
      });
  }
};


// Controller to handle GET request for fetching all homework entries
const getHomeworks = async (req, res) => {
  try {
      // Fetch all homework entries from the database
      const homeworks = await Homework.find();

      // If no homework entries found, return a message
      if (homeworks.length === 0) {
          return res.status(404).json({
              message: 'No homework found.',
          });
      }

      // Send the homeworks as response
      res.status(200).json({
          message: 'Homeworks retrieved successfully!',
          homeworks,
      });
  } catch (error) {
      // Handle any errors that occur during the process
      res.status(500).json({
          message: 'Error retrieving homeworks',
          error: error.message,
      });
  }
};

// Update homework status
const updateHomeworkStatus = async (req, res) => {
  const { homeworkId } = req.params; // homeworkId from the URL params
  const { status } = req.body; // status from the request body

  try {
    // Find the homework by its ID
    const homework = await Homework.findById(homeworkId);

    if (!homework) {
      return res.status(404).json({ message: 'Homework not found' });
    }

    // Update the status
    homework.status = status;
    
    // Save the updated homework
    await homework.save();

    return res.status(200).json({ message: 'Status updated successfully!', homework });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating status', error });
  }
};

const getAllMarks = asyncHandler(async (req, res) => {
  // Step 1: Find all marks and populate the studentId field with selected fields
  const marks = await Marks.find()
    .populate('studentId', 'firstName lastName class section roll'); // Select specific fields

  if (!marks || marks.length === 0) {
    return res.status(404).json({ message: "No marks found" });
  }

  // Step 2: Respond with the marks data
  res.status(200).json({
    message: "Marks retrieved successfully",
    marks,
  });
});


const getClassRoutine = async (req, res) => {
  try {
    // Fetch all class routines from the database
    const routines = await Routine.find();

    // If no routines found
    if (routines.length === 0) {
      return res.status(404).json({ message: "No class routines found" });
    }

    // Return the fetched routines
    return res.status(200).json(routines);
  } catch (error) {
    console.error("Error fetching class routines:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Apply for leave controller
const applyForLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, leaveType, reason } = req.body;

  // Step 1: Validate the input data
  if (!startDate || !endDate || !reason) {
    return res.status(400).json({
      message: "Please provide all necessary fields (teacherId, startDate, endDate, reason).",
    });
  }

  // Step 2: Create the leave request
  const newLeave = new Leave({
    startDate,
    endDate,
    reason,
    leaveType,
    status: 'Pending', // Default status
  });

  // Step 3: Save the leave request to the database
  await newLeave.save();

  // Step 4: Respond with success
  res.status(201).json({
    message: "Leave applied successfully.",
    leave: newLeave,
  });
});


// Get all leaves controller
const getAllLeaves = asyncHandler(async (req, res) => {
  // Step 1: Fetch all leave requests from the Leave model
  const allLeaves = await Leave.find();

  // Step 2: If no leaves are found, return a 404 error
  if (!allLeaves || allLeaves.length === 0) {
    return res.status(404).json({
      message: "No leave requests found.",
    });
  }

  // Step 3: Return all leaves
  res.status(200).json({
    message: "All leaves retrieved successfully.",
    leaves: allLeaves,
  });
});


// Controller function to get selected fields of students
const getStudentsAdmission = async (req, res) => {
  try {
    // Fetch students with selected fields only
    const students = await Student.find();

    // Return success response with the list of students
    res.status(200).json({ message: 'Students fetched successfully', students });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

const fileComplaint = async (req, res) => {
  const { studentId } = req.params
  try {
    const { title, description } = req.body;



    const student = await Student.findById(studentId);

    if (!student) return res.status(404).json({ message: "Student not found." });

    const complaint = new ComplaintModel({
      studentId,
      title,
      description,
    });

    await complaint.save();

    // Update student's complaints array
    student.complaints.push(complaint._id);
    await student.save();

    res.status(201).json({
      message: "Complaint filed successfully.",
      complaint,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


// Create a new teacher with a photo
const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, address, lastExperience, age, gender, education } = req.body;
    const photo = req.file ? req.file.path : null; // Handle photo file

    // Create a new Teacher instance
    const newTeacher = new Teacher({
      name,
      email,
      phone,
      address,
      lastExperience,
      age,
      gender,
      education,
      photo  // Save the photo path
    });

    // Save the teacher to the database
    await newTeacher.save();

    // Send response back to the client
    res.status(201).json({
      message: 'Teacher created successfully!',
      teacher: newTeacher
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error creating teacher',
      error: err.message
    });
  }
};

// Get all teachers
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.status(200).json(teachers);
  } catch (err) {
    res.status(500).json({
      message: 'Error retrieving teachers',
      error: err.message
    });
  }
};

const teacherLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the teacher by email
    const teacher = await Teacher.findOne({ email });

    if (!teacher) {
      return res.status(401).json({ message: 'Invalid Credentials' }); // Teacher not found
    }

    // Check if the provided password matches the stored one (if you're storing it hashed, compare with hashed password)
    const passwordMatches = password === teacher.password; // If you're hashing passwords, use bcrypt.compare(password, teacher.password)

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid Credentials' }); // Incorrect password
    }

    // Generate refresh token
    const refreshToken = generateRefreshToken(teacher._id);

    // Save the refresh token in the database
    teacher.refreshToken = refreshToken;
    await teacher.save();

    // Set the refresh token in an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 72 * 60 * 60 * 1000, // 3 days expiration
      sameSite: 'Strict',
    });

    // Generate access token
    const accessToken = generateToken(teacher._id);

    // Send response with teacher details, tokens, and message
    res.status(200).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      token: accessToken,
      refreshToken,
    });

  } catch (err) {
    console.error("Error Logging in Teacher:", err.message);
    res.status(500).json({
      message: 'Error logging in teacher',
      error: err.message,
    });
  }
};

export { getTeachers,
     getTeacherById, 
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
      addExamSchedule,
      updateAttendance,
      getStudentsAttendance,
      updateStudentAttendance,
      createHomework,
      getHomeworks,
      updateHomeworkStatus,
      getAllMarks,
      getClassRoutine,
      applyForLeave,
      getAllLeaves,
      getStudentsAdmission,
      fileComplaint,
      createTeacher,
      getAllTeachers,
      teacherLogin

     };
