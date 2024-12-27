import Admin from '../Models/Admin.js'
import asyncHandler from 'express-async-handler'
import Student from '../Models/Student.js';
import Teacher from '../Models/Teacher.js';
import Attendance from '../Models/Attendance.js';
import Class from '../Models/Classroom.js';
import Notice from '../Models/Notice.js';
import Subject from '../Models/Subject.js';
import PhoneCallModel from '../Models/PhoneCall.js';
import ComplaintModel from '../Models/Complaint.js';
import CertificateModel from '../Models/Certificate.js';
import SectionModel from '../Models/Section.js';
import Content from '../Models/Content.js';
import Assignment from '../Models/Assignment.js';
import Syllabus from '../Models/Syllabus.js';
import Lesson from '../Models/Lesson.js';
import Homework from '../Models/Homework.js';
import Invoice from '../Models/Invoice.js';
import Routine from '../Models/Routine.js';
import Transport from '../Models/Transport.js';
import Vehicle from '../Models/Vehicle.js';
import ExamType from '../Models/ExamType.js';
import Exam from '../Models/ExamShedule.js';
import VisitorModel from '../Models/Visitor.js';
import Topic from '../Models/Topic.js';
import Fee from '../Models/Fee.js';
import SeatPlan from '../Models/SeatPlan.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import multer from 'multer'



const adminRegistration = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  // Check if admin with the same email already exists
  const admin = await Admin.findOne({ email: email });
  if (admin) {
    return res.status(409).json({ status: "failed", message: "Email already exists" });
  }

  // Predefined roles
  const allowedRoles = ["Admin", "Teacher", "Student", "Parent"];

  // Validate role
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ status: "failed", message: "Invalid Role" });
  }

  // Ensure all fields are filled
  if (name && email && password && role) {
    try {
      // Create new Admin document
      const doc = new Admin({
        name: name,
        email: email,
        password: password,
        role: role,
      });

      await doc.save();

      // Retrieve the saved admin without the password field
      const saved_admin = await Admin.findOne({ email: email }).select("-password");

      return res.status(201).json({ message: "Registration Successful", data: saved_admin });
    } catch (error) {
      return res.status(500).json({
        status: "failed",
        message: "Unable to register",
        error: error.message,
      });
    }
  } else {
    return res.status(400).json({ message: "Please fill all the fields" });
  }
});

  const adminLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists or not
    const findAdmin = await Admin.findOne({ email });
    if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
      const refreshToken = await generateRefreshToken(findAdmin?._id);
      const updateadmin = await Admin.findByIdAndUpdate(
        findAdmin.id,
        {
          refreshToken: refreshToken,
        },
        { new: true }
      );
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
      });
      res.json({
        _id: findAdmin?._id,
        firstName: findAdmin?.firstName,
        lastName: findAdmin?.lastName,
        email: findAdmin?.email,
        mobile: findAdmin?.mobile,
        token: generateToken(findAdmin?._id),
      });
    } else {
      //throw new Error("Invalid Credentials");
      return res.json({ message: "Invalid Credentials" })
    }
  })
  
  const adminLogout = asyncHandler(async (req, res) => {
    try {
      res.clearCookie("token").status(200).json({ message: "Logout Successful" })
    } catch (error) {
      return res.status(500).json({ status: "failed", message: "Unable to logout", error: error.message });
    }
  })


// Student Management
const getStudents = asyncHandler(async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

const createStudent = asyncHandler(async (req, res) => {
    const { name, age, classId } = req.body;
    const student = new Student({ name, age, classId });
    const createdStudent = await student.save();
    res.status(201).json(createdStudent);
});

const updateStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    Object.assign(student, req.body);
    const updatedStudent = await student.save();
    res.json(updatedStudent);
});

const deleteStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    await student.remove();
    res.json({ message: 'Student removed' });
});

// Teacher Management
const getTeachers = asyncHandler(async (req, res) => {
    const teachers = await Teacher.find();
    res.json(teachers);
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


const createClass = asyncHandler(async (req, res) => {
    const { name, teacherId } = req.body;
    const newClass = new Class({ name, teacherId });
    const createdClass = await newClass.save();
    res.status(201).json(createdClass);
});

const updateClass = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
        res.status(404);
        throw new Error('Class not found');
    }
    Object.assign(classObj, req.body);
    const updatedClass = await classObj.save();
    res.json(updatedClass);
});

const deleteClass = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
        res.status(404);
        throw new Error('Class not found');
    }
    await classObj.remove();
    res.json({ message: 'Class removed' });
});

// Subject Management
const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find();
    res.json(subjects);
});

const createSubject = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const subject = new Subject({ name });
    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
});

const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }
    await subject.remove();
    res.json({ message: 'Subject removed' });
});

// Attendance Management
const markAttendance = asyncHandler(async (req, res) => {
    const { studentId, date, status } = req.body;
    const attendance = new Attendance({ studentId, date, status });
    const createdAttendance = await attendance.save();
    res.status(201).json(createdAttendance);
});


// Add a new complaint
const addComplaint = async (req, res) => {
    try {
      const {
        complaintBy,
        complaintType,
        complaintSource,
        phone,
        date,
        actionsTaken,
        assigned,
        description,
      } = req.body;
      const file = req.file ? req.file.path : null;
  
      // Validate required fields
      if (!complaintBy || !complaintType || !complaintSource || !description) {
        return res.status(400).json({ message: 'All required fields must be filled.' });
      }
  
      // Create a new complaint entry
      const complaint = new ComplaintModel({
        complaintBy,
        complaintType,
        complaintSource,
        phone,
        date,
        actionsTaken,
        assigned,
        description,
        file,
      });
  
      await complaint.save();
  
      res.status(201).json({ message: 'Complaint added successfully!', complaint });
    } catch (error) {
      res.status(500).json({ message: 'Error adding complaint.', error: error.message });
    }
  };
  
// Get complaints
const getComplaints = async (req, res) => {
  try {
    // Fetch all complaints without filtering
    const complaints = await ComplaintModel.find();

    res.status(200).json({ message: 'Complaints fetched successfully!', complaints });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints.', error: error.message });
  }
};


// Add a new phone call
 const addPhoneCall = async (req, res) => {
    try {
      const { name, phone, date, followUpDate, callDuration, description, type } = req.body;
  
      // Validate required fields
      if (!phone) {
        return res.status(400).json({ message: 'Phone number is required.' });
      }
  
      // Create a new phone call entry
      const phoneCall = new PhoneCallModel({
        name,
        phone,
        date,
        followUpDate,
        callDuration,
        description,
        type,
      });
  
      await phoneCall.save();
  
      res.status(201).json({ message: 'Phone call added successfully!', phoneCall });
    } catch (error) {
      res.status(500).json({ message: 'Error adding phone call.', error: error.message });
    }
  };
  
  // Get phone calls
const getPhoneCalls = async (req, res) => {
  try {
    // Fetch all phone calls without filtering
    const phoneCalls = await PhoneCallModel.find();

    res.status(200).json({ message: 'Phone calls fetched successfully!', phoneCalls });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching phone calls.', error: error.message });
  }
};


// Add a new certificate
const addCertificate = async (req, res) => {
    try {
      const {
        certificateName,
        headerLeftText,
        date,
        body,
        bodyFont,
        fontSize,
        footerLeftText,
        footerCenterText,
        footerRightText,
        pageLayout,
        height,
        width,
        studentPhoto,
      } = req.body;
  
      // Validate required fields
      if (!certificateName) {
        return res.status(400).json({ message: 'Certificate name is required.' });
      }
  
      // Create a new certificate entry
      const certificate = new CertificateModel({
        certificateName,
        headerLeftText,
        date,
        body,
        bodyFont,
        fontSize,
        footerLeftText,
        footerCenterText,
        footerRightText,
        pageLayout,
        height,
        width,
        studentPhoto,
      });
  
      await certificate.save();
  
      res.status(201).json({ message: 'Certificate added successfully!', certificate });
    } catch (error) {
      res.status(500).json({ message: 'Error adding certificate.', error: error.message });
    }
  };
  
  // Get certificates
 const getCertificates = async (req, res) => {
    try {
      const { certificateName, date } = req.query;
  
      // Filter by certificate name and/or date if provided
      const filter = {};
      if (certificateName) filter.certificateName = certificateName;
      if (date) filter.date = new Date(date);
  
      const certificates = await CertificateModel.find(filter);
  
      res.status(200).json({ message: 'Certificates fetched successfully!', certificates });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching certificates.', error: error.message });
    }
  };

  const addVisitor = async (req, res) => {
    try {
      const { purpose, name, phone, id, no_of_persons, date, in_time, out_time } = req.body;
  
      // Log incoming data to ensure it's correctly passed
      console.log('Incoming request data:', req.body);
    
      // Handle file upload if provided
      const file = req.file ? req.file.path : null;
  
      // Log the file to ensure it's being handled
      console.log('Uploaded file:', file);
  
      // Create a new visitor entry
      const newVisitor = new VisitorModel({
        purpose,
        name,
        phone,
        id,
        no_of_persons,
        date,
        in_time,
        out_time,
        file,
      });
    
      await newVisitor.save();
    
      return res.status(201).json({ message: 'Visitor added successfully', visitor: newVisitor });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error adding visitor', error: error.message });
    }
  };
  

// Add a new section
const addSection = async (req, res) => {
    try {
      const { name } = req.body;
  
      // Validate required field
      if (!name) {
        return res.status(400).json({ message: 'Section name is required.' });
      }
  
      // Create a new section entry
      const section = new SectionModel({ name });
  
      await section.save();
  
      res.status(201).json({ message: 'Section added successfully!', section });
    } catch (error) {
      res.status(500).json({ message: 'Error adding section.', error: error.message });
    }
  };
  
  // Get sections
const getSections = async (req, res) => {
    try {
      const { name } = req.query;
  
      // Filter by name if provided
      const filter = name ? { name } : {};
  
      const sections = await SectionModel.find(filter);
  
      res.status(200).json({ message: 'Sections fetched successfully!', sections });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching sections.', error: error.message });
    }
  };

// POST Controller to assign a class teacher
const assignClassTeacher = async (req, res) => {
  try {
      const { class: className, section, teacher } = req.body;

      // Create a new class teacher assignment
      const newAssignment = new Teacher({ class: className, section, teacher });

      // Save the new assignment to the database
      await newAssignment.save();

      res.status(201).json({ message: 'Class teacher assigned successfully.', data: newAssignment });
  } catch (error) {
      res.status(500).json({ message: 'Error assigning class teacher.', error: error.message });
  }
};



// GET Controller to retrieve all class teacher assignments
const getClassTeachers = async (req, res) => {
  try {
      // Fetch all teacher assignments from the Teacher model
      const assignments = await Teacher.find();

      res.status(200).json({ message: 'Class teacher assignments retrieved successfully.', data: assignments });
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving class teacher assignments.', error: error.message });
  }
};

// POST Controller to assign a subject teacher
const assignSubjectTeacher = async (req, res) => {
  try {
      const { class: className, section, subject, teacher } = req.body;

      // Create a new subject assignment without checking for existing assignments
      const newAssignment = new Subject({ class: className, section, subject, teacher });
      await newAssignment.save();

      res.status(201).json({ message: 'Subject teacher assigned successfully.', data: newAssignment });
  } catch (error) {
      res.status(500).json({ message: 'Error assigning subject teacher.', error: error.message });
  }
};

// GET Controller to retrieve subject assignments
const getSubjectAssignments = async (req, res) => {
  try {
      const { class: className, section, subject } = req.query;

      // Query based on class, section, and subject (optional filters)
      const filters = {};
      if (className) filters.class = className;
      if (section) filters.section = section;
      if (subject) filters.subject = subject;

      const assignments = await Subject.find(filters);

      res.status(200).json({ message: 'Subject teacher assignments retrieved successfully.', data: assignments });
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving subject teacher assignments.', error: error.message });
  }
};

// POST Controller to add a classroom
const addClassroom = async (req, res) => {
  try {
      const { roomNumber, capacity } = req.body;

      // Check if the room number already exists
      const existingClassroom = await Class.findOne({ roomNumber });
      if (existingClassroom) {
          return res.status(400).json({ message: 'Classroom with this room number already exists.' });
      }

      // Create a new classroom
      const newClassroom = new Class({ roomNumber, capacity });
      await newClassroom.save();

      res.status(201).json({ message: 'Classroom added successfully.', data: newClassroom });
  } catch (error) {
      res.status(500).json({ message: 'Error adding classroom.', error: error.message });
  }
};

// Add a new class
const addClass = async (req, res) => {
  try {
    const { className, sections } = req.body;

    // Validate if all sections exist
    const foundSections = await SectionModel.find({ name: { $in: sections } });
    if (foundSections.length !== sections.length) {
      return res.status(400).json({ message: 'One or more sections not found.' });
    }

    // Get the section IDs
    const sectionIds = foundSections.map(section => section._id);

    // Create a new class entry
    const newClass = new Class({
      className,
      sections: sectionIds, // Save array of section IDs
    });

    await newClass.save();

    return res.status(201).json({ message: 'Class added successfully', class: newClass });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding class', error: error.message });
  }
};

const getClasses = async (req, res) => {
  try {
    // Find classes and select only the `className` field
    const classes = await Class.find({}, 'className');

    if (!classes || classes.length === 0) {
      return res.status(404).json({ message: 'No classes found.' });
    }

    return res.status(200).json({ message: 'Classes retrieved successfully', classes });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving classes', error: error.message });
  }
};




// GET Controller to retrieve classrooms
const getClassrooms = async (req, res) => {
  try {
      const { roomNo } = req.query;

      // Query based on room number (optional filter)
      const filters = {};
      if (roomNo) filters.roomNo = roomNo;

      const classrooms = await Class.find(filters);

      res.status(200).json({ message: 'Classrooms retrieved successfully.', data: classrooms });
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving classrooms.', error: error.message });
  }
};

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

// POST Controller to upload content
const uploadContent = async (req, res) => {
  try {
      const {
          contentTitle,
          contentType,
          availableFor,
          class: className,
          section,
          date,
          description,
          sourceURL,
      } = req.body;

      // Create a new content entry
      const newContent = new Content({
          contentTitle,
          contentType,
          availableFor,
          class: className,
          section,
          date,
          description,
          sourceURL,
          documentFile: req.file ? req.file.path : null,
      });
      await newContent.save();

      res.status(201).json({ message: 'Content uploaded successfully.', data: newContent });
  } catch (error) {
      res.status(500).json({ message: 'Error uploading content.', error: error.message });
  }
};

// GET Controller to retrieve uploaded content
const getContent = async (req, res) => {
  try {
      const contents = await Content.find();

      res.status(200).json({ message: 'Content retrieved successfully.', data: contents });
  } catch (error) {
      res.status(500).json({ message: 'Error retrieving content.', error: error.message });
  }
};

// POST Controller to create assignment
const postAssignment = async (req, res) => {
  try {
      const {
          assignmentTitle,
          subject,
          availableFor,
          class: className,
          section,
          dueDate,
          description,
      } = req.body;

      const newAssignment = new Assignment({
          assignmentTitle,
          subject,
          availableFor,
          class: className,
          section,
          dueDate,
          description,
          documentFile: req.file ? req.file.path : undefined,
      });
      await newAssignment.save();

      res.status(201).json({ message: 'Assignment created successfully.', data: newAssignment });
  } catch (error) {
      res.status(500).json({ message: 'Error creating assignment.', error: error.message });
  }
};

// Controller function to add a new lesson (POST)
 const addLesson = async (req, res) => {
  const { class: lessonClass, subject, lessonName, title } = req.body;

  // Check if all required fields are provided
  if (!lessonClass || !subject || !lessonName || !title) {
    return res.status(400).json({ message: 'All fields (class, subject, lessonName, title) are required' });
  }

  try {
    // Create a new lesson
    const newLesson = new Lesson({
      class: lessonClass,
      subject: subject,
      lessonName: lessonName,
      title: title  // Include title here
    });

    // Save the lesson to the database
    await newLesson.save();

    // Return success response
    res.status(201).json({ message: 'Lesson added successfully', lesson: newLesson });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding lesson', error: error.message });
  }
};

// Controller function to get all lessons (GET) without filters
 const getLessons = async (req, res) => {
  try {
    // Fetch all lessons from the database (no filter applied)
    const lessons = await Lesson.find();

    // Return the lessons
    res.status(200).json({ message: 'Lessons retrieved successfully', lessons });
  } catch (error) {
    // Handle errors during fetch
    res.status(500).json({ message: 'Error fetching lessons', error: error.message });
  }
};

// Controller function to add a new student category (POST)
 const addStudentCategory = async (req, res) => {
  const { type } = req.body;

  // Check if type is provided
  if (!type) {
    return res.status(400).json({ message: 'Type is required' });
  }

  try {
    // Create a new student category
    const newCategory = new Student({
      type
    });

    // Save the category to the database
    await newCategory.save();

    // Return success response
    res.status(201).json({ message: 'Student category added successfully', category: newCategory });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding student category', error: error.message });
  }
};

// Controller function to get all student categories (GET)
 const getStudentCategories = async (req, res) => {
  try {
    // Fetch all student categories from the database
    const categories = await Student.find();

    // Return the categories
    res.status(200).json({ message: 'Student categories retrieved successfully', categories });
  } catch (error) {
    // Handle errors during fetch
    res.status(500).json({ message: 'Error fetching student categories', error: error.message });
  }
};


const addStudent = async (req, res) => {
  const {
    academicYear,
    studentClass,
    section,
    admissionNumber,
    admissionDate,
    roll,
    group,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    religion,
    caste,
    studentPhoto,
    email,
    phone,
    address,
    fatherName,
    motherName,
    guardianName,
    fatherOccupation,
    motherOccupation,
    guardianPhone,
    documentType,
    documentNumber,
    issueDate,
    expirationDate,
    previousSchoolName,
    gradeCompleted,
    schoolAddress,
    schoolContact,
    additionalInfo,
    customField1
  } = req.body;

  try {
    // Create a new student record
    const newStudent = new Student({
      academicYear,
      class: studentClass,
      section,
      admissionNumber,
      admissionDate,
      roll,
      group,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      religion,
      caste,
      studentPhoto,
      email,
      phone,
      address,
      fatherName,
      motherName,
      guardianName,
      fatherOccupation,
      motherOccupation,
      guardianPhone,
      documentType,
      documentNumber,
      issueDate,
      expirationDate,
      previousSchoolName,
      gradeCompleted,
      schoolAddress,
      schoolContact,
      additionalInfo,
      customField1
    });

    // Save the student record to the database
    await newStudent.save();

    // Return success response
    res.status(201).json({ message: 'Student added successfully', student: newStudent });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding student', error: error.message });
  }
};


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


// Controller function to get a single student's data by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params; // Extract student ID from request parameters

    // Fetch the student using the provided ID, only return selected fields
    const student = await Student.findById(id, 'admissionNumber firstName lastName fatherName dateOfBirth class gender category attendanceStatus section');

    if (!student) {
      // If student is not found, return a 404 response
      return res.status(404).json({ message: 'Student not found' });
    }

    // Return the student data as a success response
    res.status(200).json({ message: 'Student fetched successfully', student });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};



// Controller to fetch students and export as Excel or PDF
const exportStudentsData = async (req, res) => {
  try {
    // Fetch students with selected fields only
    const students = await Student.find({}, 'admissionNumber firstName lastName fatherName dateOfBirth class gender category attendanceStatus');

    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No students data found.' });
    }

    const format = req.query.format || 'excel'; // Format can be either 'excel' or 'pdf'

    // Export to Excel
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Students Data');

      // Add headers
      worksheet.columns = [
        { header: 'Admission No', key: 'admissionNumber', width: 20 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Father Name', key: 'fatherName', width: 20 },
        { header: 'Date of Birth', key: 'dateOfBirth', width: 20 },
        { header: 'Class', key: 'class', width: 10 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Attendance Status', key: 'attendanceStatus', width: 20 }
      ];

      // Add rows
      students.forEach((student) => {
        worksheet.addRow(student);
      });

      // Set response headers for Excel file
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=students_data.xlsx');

      // Send Excel file to the client
      await workbook.xlsx.write(res);
      res.end();
    } 
    
    // Export to PDF
    else if (format === 'pdf') {
      const doc = new PDFDocument();
      let fileName = 'students_data.pdf';

      // Set response headers for PDF file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

      // Pipe the document to the response
      doc.pipe(res);

      // Set title for the PDF
      doc.fontSize(18).text('Students Data', { align: 'center' });
      doc.moveDown();

      // Add table headers
      const tableHeaders = [
        'Admission No', 'First Name', 'Last Name', 'Father Name', 'Date of Birth', 
        'Class', 'Gender', 'Category', 'Attendance Status'
      ];

      tableHeaders.forEach(header => {
        doc.fontSize(12).text(header, { continued: true });
        doc.moveUp(1);
      });

      // Add rows for each student
      students.forEach(student => {
        doc.fontSize(10).text(`
          ${student.admissionNumber || 'N/A'} | 
          ${student.firstName || 'N/A'} | 
          ${student.lastName || 'N/A'} | 
          ${student.fatherName || 'N/A'} | 
          ${student.dateOfBirth ? student.dateOfBirth.toISOString().split('T')[0] : 'N/A'} | 
          ${student.class || 'N/A'} | 
          ${student.gender || 'N/A'} | 
          ${student.category || 'N/A'} | 
          ${student.attendanceStatus || 'N/A'}
        `);
        doc.moveDown(1);
      });

      // Finalize the PDF file
      doc.end();
    }
    
    else {
      return res.status(400).json({ message: 'Invalid format. Please choose "excel" or "pdf".' });
    }

  } catch (error) {
    console.error('Error exporting students data:', error);
    res.status(500).json({ message: 'Error exporting students data', error: error.message });
  }
};
// Controller function to get all attendance records
 const getAttendance = async (req, res) => {
  try {
    // Fetch all attendance records from the database
    const attendanceRecords = await Attendance.find();

    // Return success response with the list of attendance records
    res.status(200).json({ message: 'Attendance records fetched successfully', attendance: attendanceRecords });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching attendance records', error: error.message });
  }
};

// Controller function to add a new student group
 const addStudentGroup = async (req, res) => {
  const { groupName, students } = req.body;

  // Check if required fields are provided
  if (!groupName || !students || students.length === 0) {
    return res.status(400).json({ message: 'Group name and student list are required' });
  }

  try {
    // Create a new student group
    const newStudentGroup = new StudentGroup({
      groupName,
      students
    });

    // Save the student group to the database
    await newStudentGroup.save();

    // Return success response
    res.status(201).json({ message: 'Student group added successfully', studentGroup: newStudentGroup });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding student group', error: error.message });
  }
};

// Controller function to get all student groups
 const getStudentGroups = async (req, res) => {
  try {
    // Fetch all student groups from the database, including populated student data
    const studentGroups = await StudentGroup.find().populate('students', 'firstName lastName admissionNumber');  // Populating student details

    // Return success response with the list of student groups
    res.status(200).json({ message: 'Student groups fetched successfully', studentGroups });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching student groups', error: error.message });
  }
};


// Controller function to add a new fees group
 const addFeesGroup = async (req, res) => {
  const { name, description } = req.body;

  // Check if required fields are provided
  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  try {
    // Create a new fees group
    const newFeesGroup = new Fee({
      name,
      description
    });

    // Save the fees group to the database
    await newFeesGroup.save();

    // Return success response
    res.status(201).json({ message: 'Fees group added successfully', feesGroup: newFeesGroup });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding fees group', error: error.message });
  }
};

// Controller function to get all fees groups
 const getFeesGroups = async (req, res) => {
  try {
    // Fetch all fees groups from the database
    const feesGroups = await Fee.find();

    // Return success response with the list of fees groups
    res.status(200).json({ message: 'Fees groups fetched successfully', feesGroups });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching fees groups', error: error.message });
  }
};

// Controller function to add a new fees type
 const addFeesType = async (req, res) => {
  const { name, feesGroup, description } = req.body;

  // Check if required fields are provided
  if (!name || !feesGroup || !description) {
    return res.status(400).json({ message: 'Name, Fees Group, and Description are required' });
  }

  try {
    // Create a new fees type
    const newFeesType = new Fee({
      name,
      feesGroup,
      description
    });

    // Save the fees type to the database
    await newFeesType.save();

    // Return success response
    res.status(201).json({ message: 'Fees type added successfully', feesType: newFeesType });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding fees type', error: error.message });
  }
};

// Controller function to get all fees types
 const getFeesTypes = async (req, res) => {
  try {
    // Fetch all fees types from the database
    const feesTypes = await Fee.find();

    // Return success response with the list of fees types
    res.status(200).json({ message: 'Fees types fetched successfully', feesTypes });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching fees types', error: error.message });
  }
};

// Controller function to get all invoices
export const getInvoices = async (req, res) => {
  try {
    // Fetch all invoices, populating student details
    const invoices = await Invoice.find().populate('student');

    // Return the list of invoices with necessary fields
    const invoiceDetails = invoices.map(invoice => ({
      SL: invoice._id,
      Student: `${invoice.student.firstName} ${invoice.student.lastName}`,  // Assuming Student model has firstName and lastName
      Amount: invoice.amount,
      Waiver: invoice.waiver,
      Fine: invoice.fine,
      Paid: invoice.paid,
      Balance: invoice.balance,
      Status: invoice.status,
      Date: invoice.date
    }));

    // Send the response
    res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices: invoiceDetails
    });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({
      message: 'Error fetching invoices',
      error: error.message
    });
  }
};

// Controller function to add a transport route
 const addTransportRoute = async (req, res) => {
  const { routeTitle, fare } = req.body;

  // Check if all required fields are provided
  if (!routeTitle || !fare) {
    return res.status(400).json({ message: 'Route title and fare are required' });
  }

  try {
    // Create a new transport route entry
    const newRoute = new Transport({
      routeTitle: routeTitle,
      fare: fare
    });

    // Save the route to the database
    await newRoute.save();

    // Return success response
    res.status(201).json({ message: 'Transport route added successfully', route: newRoute });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding transport route', error: error.message });
  }
};

// Controller function to get all transport routes
 const getTransportRoutes = async (req, res) => {
  try {
    // Fetch all transport route records from the database
    const routes = await Transport.find();

    // Return the fetched transport routes
    res.status(200).json({
      message: 'Transport routes fetched successfully',
      routes: routes
    });
  } catch (error) {
    // Handle errors during fetch
    res.status(500).json({ message: 'Error fetching transport routes', error: error.message });
  }
};

// Controller function to add a vehicle
 const addVehicle = async (req, res) => {
  const { vehicleNumber, vehicleModel, yearMade, driver, note } = req.body;


  try {
    // Create a new vehicle entry
    const newVehicle = new Vehicle({
      vehicleNumber: vehicleNumber,
      vehicleModel: vehicleModel,
      yearMade: yearMade,
      driver: driver,
      note: note
    });

    // Save the vehicle to the database
    await newVehicle.save();

    // Return success response
    res.status(201).json({ message: 'Vehicle added successfully', vehicle: newVehicle });
  } catch (error) {
    // Handle errors during save
    res.status(500).json({ message: 'Error adding vehicle', error: error.message });
  }
};

// Controller function to get all vehicles
 const getVehicles = async (req, res) => {
  try {
    // Fetch all vehicle records from the database
    const vehicles = await Vehicle.find();

    // Return the fetched vehicles
    res.status(200).json({
      message: 'Vehicles fetched successfully',
      vehicles: vehicles
    });
  } catch (error) {
    // Handle errors during fetch
    res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
  }
};

// Controller function to assign a vehicle to a route
 const assignVehicle = async (req, res) => {
  const { route, vehicle } = req.body;


  try {
    // Create an assignment entry
    const newAssignment = new Vehicle({
      route: route,
      vehicle: vehicle
    });

    // Save the assignment to the database
    await newAssignment.save();

    // Return success response
    res.status(201).json({ message: 'Vehicle assigned to route successfully', assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Error assigning vehicle to route', error: error.message });
  }
};

// Controller function to get all vehicle assignments
 const getVehicleAssignments = async (req, res) => {
  try {
    // Fetch all assignments from the database
    const assignments = await Vehicle.find()
      .populate('route', 'routeTitle')  // Populate route details
      .populate('vehicle', 'vehicleNumber vehicleModel');  // Populate vehicle details

    // Return the fetched assignments
    res.status(200).json({
      message: 'Vehicle assignments fetched successfully',
      assignments: assignments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vehicle assignments', error: error.message });
  }
};

// Controller function to add a new exam type
 const addExamType = async (req, res) => {
  const { examName } = req.body;

  if (!examName) {
    return res.status(400).json({ message: 'Exam name is required' });
  }

  try {
    // Create a new exam type entry
    const newExamType = new ExamType({
      examName: examName
    });

    // Save the new exam type to the database
    await newExamType.save();

    // Return success response
    res.status(201).json({ message: 'Exam type added successfully', examType: newExamType });
  } catch (error) {
    res.status(500).json({ message: 'Error adding exam type', error: error.message });
  }
};

// Controller function to get all exam types
 const getExamTypes = async (req, res) => {
  try {
    // Fetch all exam types from the database
    const examTypes = await ExamType.find();

    // Return the fetched exam types
    res.status(200).json({
      message: 'Exam types fetched successfully',
      examTypes: examTypes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam types', error: error.message });
  }
};


// Controller function to add a new exam schedule
 const addExamSchedule = async (req, res) => {
  const { examTitle, class: examClass, section, subject, examDate, startTime, endTime } = req.body;

  try {
    // Create a new exam schedule entry
    const newExamSchedule = new Exam({
      examTitle,
      class: examClass,
      section,
      subject,
      examDate,
      startTime,
      endTime
    });

    // Save the new exam schedule to the database
    await newExamSchedule.save();

    // Return success response
    res.status(201).json({ message: 'Exam schedule added successfully', examSchedule: newExamSchedule });
  } catch (error) {
    res.status(500).json({ message: 'Error adding exam schedule', error: error.message });
  }
};

// Controller function to get all exam schedules
const getExamSchedule = async (req, res) => {
  try {
    // Fetch all exam schedules from the database
    const examSchedules = await Exam.find();

    if (examSchedules.length === 0) {
      return res.status(404).json({ message: 'No exam schedules found' });
    }

    // Return the list of exam schedules
    res.status(200).json({ message: 'Exam schedules fetched successfully', examSchedules });
  } catch (error) {
    // Handle errors during the fetch operation
    res.status(500).json({ message: 'Error fetching exam schedules', error: error.message });
  }
};



// Controller function to get all exam schedules
 const getExamSchedules = async (req, res) => {
  try {
    // Fetch all exam schedules from the database
    const examSchedules = await ExamSchedule.find();

    // Return the fetched exam schedules
    res.status(200).json({
      message: 'Exam schedules fetched successfully',
      examSchedules: examSchedules
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam schedules', error: error.message });
  }
};

const createSeatPlan = async (req, res) => {
  try {
    const { roomNumber, seatRules, class: studentClass, section, exam } = req.body;

    // Check if seat rules are provided
    if (!seatRules || seatRules.length === 0) {
      return res.status(400).json({ message: "Seat rule data is required." });
    }

    // Validate the class, section, and exam data (optional validation)
    if (!studentClass || !section || !exam) {
      return res.status(400).json({ message: "Class, Section, and Exam data are required." });
    }

    // Get all students based on the class and section, sorted by roll number
    const students = await Student.find({
      class: studentClass,
      section: section,
    }).sort("rollNumber");

    // Check if no students found
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found for the provided class and section." });
    }

    // Create seat plan data based on roll number ranges
    const seatPlanData = [];

    // Iterate over each seat rule (like 1-50, 51-100)
    seatRules.forEach((rule) => {
      let seatNumber = seatPlanData.length + 1;  // Start from the current seat number

      // For each rule, check if a student falls in the roll number range
      students.forEach((student) => {
        if (student.rollNumber >= rule.startRoll && student.rollNumber <= rule.endRoll) {
          seatPlanData.push({
            seatNumber: seatNumber++, // Increment seat number for each student
            studentId: student._id, // Student data
            name: student.name, // Student name
            roomNumber,
            row: rule.row,
            class: studentClass,  // Add class to seat plan
            section,  // Add section to seat plan
            exam,  // Add exam to seat plan
          });
        }
      });

      // If no students are found in the range, add a seat with null for studentId and name
      const studentsInRange = seatPlanData.filter(seat => seat.row === rule.row);
      if (studentsInRange.length === 0) {
        seatPlanData.push({
          seatNumber: seatNumber, // Seat number continues from where it left off
          studentId: null, // No student matched the range
          name: null, // No student matched the range
          roomNumber,
          row: rule.row,
          class: studentClass,  // Add class to the row
          section,  // Add section to the row
          exam,  // Add exam to the row
        });
      }
    });

    // Save seat plan data (without duplicates)
    const createdSeatPlan = await SeatPlan.insertMany(seatPlanData);

    return res.status(201).json({
      message: "Seat plan created successfully",
      seatPlan: seatPlanData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};




// Get all seat plans
const getSeatPlan = async (req, res) => {
  try {
    // Get all seat plans
    const seatPlan = await SeatPlan.find()

    if (!seatPlan || seatPlan.length === 0) {
      return res.status(404).json({ message: "No seat plans found." });
    }

    return res.status(200).json({ seatPlan });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Controller function to generate an admit card
 const generateAdmitCard = async (req, res) => {
  const { studentId, examId } = req.body;

  // Validate the request
  if (!studentId || !examId) {
    return res.status(400).json({ message: 'Student ID and Exam ID are required' });
  }

  try {
    // Fetch student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Fetch exam details
    const exam = await ExamSchedule.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Create a new admit card entry in the database (Optional)
    const admitCard = new AdmitCard({
      studentId: student._id,
      examTitle: exam.examTitle,
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      class: student.class,
      section: student.section,
      subject: exam.subject,
      admitCardGenerated: true
    });

    await admitCard.save();  // Save admit card in the database

    // Generate the Admit Card PDF using PDFKit
    const doc = new PDFDocument();
    doc.fontSize(20).text('Admit Card', { align: 'center' });
    doc.moveDown(2);

    // Student Details
    doc.fontSize(14).text(`Name: ${student.firstName} ${student.lastName}`);
    doc.text(`Admission Number: ${student.admissionNumber}`);
    doc.text(`Class: ${student.class} - Section: ${student.section}`);
    doc.text(`Date of Birth: ${student.dateOfBirth.toDateString()}`);
    doc.moveDown(1);

    // Exam Details
    doc.text(`Exam Title: ${exam.examTitle}`);
    doc.text(`Subject: ${exam.subject}`);
    doc.text(`Exam Date: ${new Date(exam.examDate).toDateString()}`);
    doc.text(`Start Time: ${exam.startTime}`);
    doc.text(`End Time: ${exam.endTime}`);

    // End of Document
    doc.end();

    // Send the PDF file as the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=admit_card.pdf');
    doc.pipe(res);  // Pipe the generated PDF to the response

  } catch (error) {
    res.status(500).json({ message: 'Error generating admit card', error: error.message });
  }
};

const addTopic = async (req, res) => {
  try {
    const { className, section, subject, lesson, topic } = req.body;

    // Validate input fields
    if (!className || !section || !subject || !lesson || !topic) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if the topic already exists for the given lesson
    const existingTopic = await Topic.findOne({ lesson, topic });
    if (existingTopic) {
      return res.status(400).json({ message: 'Topic already exists for this lesson.' });
    }

    // Create a new topic entry
    const newTopic = new Topic({
      className,
      section,
      subject,
      lesson,
      topic,
    });

    // Save the topic in the database
    await newTopic.save();

    res.status(201).json({ message: 'Topic added successfully.', data: newTopic });
  } catch (error) {
    res.status(500).json({ message: 'Error adding topic.', error: error.message });
  }
};

const getSubjectWiseAttendance = async (req, res) => {
  const { class: classFilter, section, subject, attendanceDate } = req.query;

  try {
    // Build the filter query dynamically based on provided filters
    const filter = {};

    // Check if 'class' filter is provided
    if (classFilter) {
      filter.class = classFilter;
    }

    // Check if 'section' filter is provided
    if (section) {
      filter.section = section;
    }

    // Check if 'subject' filter is provided
    if (subject) {
      filter.subject = subject;
    }

    // Check if 'attendanceDate' filter is provided
    if (attendanceDate) {
      filter.attendanceDate = new Date(attendanceDate); // Convert to Date object if necessary
    }

    // Fetch attendance data from the database based on the dynamic filter
    const attendanceData = await Attendance.find(filter);

    // If no records are found based on the provided filters
    if (attendanceData.length === 0) {
      return res.status(404).json({ message: "No attendance records found for the given criteria." });
    }

    // If data is found, return the attendance records
    return res.status(200).json({
      message: "Attendance records fetched successfully",
      attendanceData,
    });

  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ message: "An error occurred while fetching the attendance data." });
  }
};

// Controller for adding homework
const addHomework = async (req, res) => {
  try {
    // Handle file upload
    let file = '';
    if (req.file) {
      file = req.file.path; // Get the path of the uploaded file
    }

    // Create a new homework entry
    const newHomework = new Homework({
      class: req.body.class,
      subject: req.body.subject,
      section: req.body.section,
      homeworkDate: req.body.homeworkDate,
      submissionDate: req.body.submissionDate,
      marks: req.body.marks,
      file: file, // Save the uploaded file path
      description: req.body.description,
    });

    // Save the homework entry to the database
    await newHomework.save();

    // Respond with success
    res.status(201).json({
      message: 'Homework added successfully',
      homework: newHomework,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding homework' });
  }
};



// Controller to get all homework
 const getAllHomework = async (req, res) => {
  try {
    const homework = await Homework.find();  // Fetch all homework entries
    res.status(200).json(homework);  // Send homework data as JSON response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching homework' });
  }
};


// Create or update a class routine
const createOrUpdateClassRoutine = async (req, res) => {
  const { class : className, section, routine } = req.body;

  try {
    // Manually create a new routine or update the existing one based on className and section
    const newRoutine = new Routine({ class: className, section, routine });

    // Save the routine to the database
    await newRoutine.save();

    // Return the created routine in the required response format
    return res.status(201).json([{
      class: newRoutine.class,
      section: newRoutine.section,
      routine: newRoutine.routine,
    }]);
  } catch (error) {
    console.error("Error creating or updating class routine:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

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

// Controller to add a new assignment
 const addAssignment = async (req, res) => {
  try {
    // Handle file upload
    let file = '';
    if (req.file) {
      file = req.file.path; // Get the path of the uploaded file
    }

    // Create a new homework entry
    const newHomework = new Assignment({
      class: req.body.class,
      subject: req.body.subject,
      section: req.body.section,
      assignmentTitle: req.body.assignmentTitle,
      availableFor: req.body.availableFor,
      dueDate: req.body.dueDate,
      file: file, // Save the uploaded file path
      description: req.body.description,
    });

    // Save the homework entry to the database
    await newHomework.save();

    // Respond with success
    res.status(201).json({
      message: 'Homework added successfully',
      homework: newHomework,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding homework' });
  }
};

// Controller to get assignments (with optional filters)
 const getAssignments = async (req, res) => {
  try {
    const { class: className, section } = req.query;

    // Build the filters dynamically if provided
    const filters = {};
    if (className) filters.class = className;
    if (section) filters.section = section;

    // Fetch assignments based on filters (or all if filters are empty)
    const assignments = await Assignment.find(filters);

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No assignments found' });
    }

    res.status(200).json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assignments' });
  }
};

// Controller to post a new syllabus
 const postSyllabus = async (req, res) => {
  try {
    let file = '';
    if (req.file) {
      file = req.file.path; // Get the path of the uploaded file
    }

    const newSyllabus = new Syllabus({
      syllabusTitle: req.body.syllabusTitle,
      syllabusType: req.body.syllabusType,
      availableFor: req.body.availableFor,
      class: req.body.class,
      section: req.body.section,
      date: req.body.date,
      description: req.body.description,
      file: file,
    });

    await newSyllabus.save();
    res.status(201).json({ message: "Syllabus posted successfully", syllabus: newSyllabus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error posting syllabus" });
  }
};

// Controller to get syllabus data
 const getSyllabus = async (req, res) => {
  try {
    const { class: className, section } = req.query;

    // Build filters dynamically if provided
    const filters = {};
    if (className) filters.class = className;
    if (section) filters.section = section;

    // Fetch syllabus based on filters (or all if filters are empty)
    const syllabus = await Syllabus.find(filters);

    if (syllabus.length === 0) {
      return res.status(404).json({ message: "No syllabus found" });
    }

    res.status(200).json(syllabus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching syllabus" });
  }
};

 const addAttendance = async (req, res) => {
  try {
    const { studentId, class: className, section, date, status } = req.body;

    // Extract the month and year from the provided date
    const month = new Date(date).getMonth() + 1; // getMonth() is 0-indexed, so add 1
    const year = new Date(date).getFullYear();   // Extract the year

    // Create a new attendance entry
    const newAttendance = new Attendance({
      studentId,
      class: className,
      section,
      date,
      status,
      month: month.toString().padStart(2, '0'), // Ensure month is in 2-digit format
      year: year.toString(),                    // Ensure year is in 4-digit format
    });

    // Save the attendance entry to the database
    await newAttendance.save();

    res.status(201).json({
      message: 'Attendance added successfully',
      attendance: newAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding attendance' });
  }
};


const createNotice = asyncHandler(async (req, res) => {
  const { title, description, date, className, section, targetAudience, postedBy } = req.body;

  // Step 1: Create a new notice document
  const newNotice = new Notice({
      title,
      description,
      date,
      class: className,
      section,
      targetAudience,
      postedBy
  });

  // Step 2: Save the new notice to the database
  const createdNotice = await newNotice.save();

  // Step 3: Respond with the created notice
  res.status(201).json({
      message: "Notice created successfully",
      notice: createdNotice
  });
});


const addSubject = asyncHandler(async (req, res) => {
  const { subjectName, teacher, subjectType, class: className, section, examDate, examTime } = req.body;

  // Step 1: Create a new subject object
  const newSubject = new Subject({
      subjectName,
      teacher,
      subjectType,
      class: className,
      section,
      schedule: { examDate, examTime },
  });

  // Save the subject to the database
  const createdSubject = await newSubject.save();

  // Step 2: Find all students in the specified class and section
  const studentsInClassAndSection = await Student.find({
      class: className,  // Match the class field in Student model
      section,
  });

  if (!studentsInClassAndSection || studentsInClassAndSection.length === 0) {
      return res.status(404).json({ message: "No students found for this class and section" });
  }

  // Step 3: Push the subject's ObjectId to each student's subjects array
  for (let student of studentsInClassAndSection) {
      // Ensure the student's subjects field is an array (in case it's undefined or null)
      if (!student.subjects) {
          student.subjects = [];
      }

      // Push the ObjectId of the created subject
      student.subjects.push(createdSubject._id);

      await student.save(); // Save the student after adding the new subject
  }

  // Step 4: Respond with success message and the created subject
  res.status(201).json({
      message: "Subject added successfully to all students in this class and section",
      subject: createdSubject,
  });
});

// Controller to create transport and assign it to a student
const createTransportAndAssignToStudent = asyncHandler(async (req, res) => {
  const { studentId, transportData } = req.body;  // Get studentId and transport data from the request body

  // Step 1: Create a new transport object
  const { transportType, route, pickupTime, dropTime, vehicle, driver } = transportData;

  const newTransport = new Transport({
    transportType,
    route,
    pickupTime,
    dropTime,
    vehicle,
    driver,
  });

  // Step 2: Save the transport to the database
  const createdTransport = await newTransport.save();

  // Step 3: Find the student by their studentId
  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Step 4: Assign the created transport to the student
  student.transport = createdTransport._id;

  // Step 5: Save the student with the assigned transport
  await student.save();

  // Step 6: Respond with success message and student details
  res.status(200).json({
    message: "Transport created and assigned to student successfully",
    student: {
      name: student.name,
      rollNumber: student.rollNumber,
      class: student.class,
      section: student.section,
      transport: createdTransport, // Include transport details
    },
  });
});

export { 
  adminRegistration,
   adminLogin,
    adminLogout,
      getStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getTeachers,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getClasses,
    createClass,
    updateClass,
    deleteClass,
    getSubjects,
    createSubject,
    deleteSubject,
    markAttendance,
    getAttendance,
    addComplaint,
    getComplaints,
    addPhoneCall,
    getPhoneCalls,
    addCertificate,
    getCertificates,
    addSection,
    getSections,
    assignClassTeacher,
    getClassTeachers,
    assignSubjectTeacher,
    getSubjectAssignments,
    addClassroom,
    getClassrooms,
    uploadContent,
    getContent,
    postAssignment,
    addLesson,
    getLessons,
    addStudentCategory,
    getStudentCategories,
    addStudent,
    getStudentsAdmission,
    addStudentGroup,
    getStudentGroups,
    addFeesGroup,
    getFeesGroups,
    addFeesType,
    getFeesTypes,
    addTransportRoute,
    getTransportRoutes,
    addVehicle,
    getVehicles,
    assignVehicle,
    getVehicleAssignments,
    addExamType,
    getExamTypes,
    addExamSchedule,
    getExamSchedules,
    generateAdmitCard,
    addVisitor,
    addClass,
    addTopic,
    getSubjectWiseAttendance,
    exportStudentsData,
    addHomework,
    getAllHomework,
    createSeatPlan,
    getSeatPlan,
    getStudentById,
    getExamSchedule,
    createOrUpdateClassRoutine,
    getClassRoutine,
    addAssignment,
    getAssignments,
    postSyllabus,
    getSyllabus,
    addAttendance,
    createNotice,
    addSubject,
    createTransportAndAssignToStudent
}