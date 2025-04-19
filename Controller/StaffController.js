import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import admin from '../config/firebaseConfig.js'; // Import Firebase config
import Staff from '../Models/Staff.js';
import multer from 'multer'; // Import multer for file handling
import path from 'path';  // To resolve file paths
dotenv.config();


// Set up storage for profile images using Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles'); // Specify folder to store uploaded files
  },
  filename: function (req, file, cb) {
    // Set the filename for the uploaded file
    cb(null, Date.now() + '-' + file.originalname); // Add timestamp to avoid conflicts
  },
});

// Filter to ensure only image files can be uploaded
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'));
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: fileFilter,
});


// Staff Registration Controller
export const registerStaff = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    // Check if staff already exists
    const staffExist = await Staff.findOne({ $or: [{ email }, { mobile }] });
    if (staffExist) {
      return res.status(400).json({ message: 'Staff with this email or mobile already exists!' });
    }

    // Create a new staff member
    const newStaff = new Staff({
      name,
      email,
      mobile,
    });

    // Save the staff to the database
    await newStaff.save();

    // Generate JWT token for the staff member
    const token = jwt.sign({ id: newStaff._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    return res.status(201).json({ message: 'Staff Registration successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Staff Login Controller
export const loginStaff = async (req, res) => {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: "Mobile number is required" });
    }
  
    try {
      // ✅ Firebase se staff check karo
      let staff;
      try {
        staff = await admin.auth().getUserByPhoneNumber(mobile);
      } catch (error) {
        // 🆕 Agar staff nahi mila to naya staff create karo
        staff = await admin.auth().createUser({ phoneNumber: mobile });
      }
  
      // ✅ 4-digit OTP generate karo
      const otp = Math.floor(1000 + Math.random() * 9000);
      console.log(`📲 Sending OTP ${otp} to ${mobile}`);
  
      // ⚠ Yaha SMS API integrate karni hogi (Firebase ya Twilio)
      
      return res.json({ message: "OTP sent successfully", otp }); // ⚠ Testing ke liye OTP return kar rahe hain
    } catch (error) {
      return res.status(500).json({ error: "Failed to send OTP", details: error.message });
    }
};

// Staff OTP Verification Controller
export const verifyStaffOtp = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: "ID Token is required" });
        }

        // Verify the ID Token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { phone_number } = decodedToken;

        // Check if staff exists in database
        let staff = await Staff.findOne({ mobile: phone_number });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

        return res.status(200).json({ message: "Staff verified successfully", token });
    } catch (error) {
        return res.status(500).json({ message: "OTP Verification failed", error: error.message });
    }
};

// Staff Controller (GET Staff)
export const getStaff = async (req, res) => {
  try {
    const staffId = req.params.id;  // Get the staff ID from request params

    // Find staff member by ID
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found!' });
    }

    return res.status(200).json({
      message: 'Staff details retrieved successfully!', // Message to confirm successful retrieval
      id: staff._id,         // Include the staff ID in the response
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      profileImage: staff.profileImage || 'default-profile-image.jpg', // Include profile image (or default if none)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Staff Controller (Update Staff)
export const updateStaff = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const staffId = req.params.id;  // Get the staff ID from request params
      const { name, email, mobile } = req.body;  // Get the fields to update from request body

      // Find the staff member by ID
      const staff = await Staff.findById(staffId);

      if (!staff) {
        return res.status(404).json({ message: 'Staff not found!' });
      }

      // Check if a profile image is uploaded and update the profileImage field
      const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : staff.profileImage;

      // Update the staff member's details
      staff.name = name || staff.name;
      staff.email = email || staff.email;
      staff.mobile = mobile || staff.mobile;
      staff.profileImage = profileImage;  // Update profile image if provided

      // Save the updated staff member to the database
      await staff.save();

      return res.status(200).json({
        message: 'Staff updated successfully',
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          mobile: staff.mobile,
          profileImage: staff.profileImage, // Include the updated profile image
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];


// Staff Controller (CREATE Staff Profile)
export const createStaffProfile = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const staffId = req.params.staffId; // Get staffId from params

      // Check if the staff already exists by staffId
      const existingStaff = await Staff.findById(staffId);

      if (!existingStaff) {
        return res.status(404).json({ message: 'Staff not found!' });
      }

      // If a profile image is uploaded, update the profileImage field
      const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : existingStaff.profileImage;

      // Update the staff's profile image
      existingStaff.profileImage = profileImage;

      // Save the updated staff to the database
      await existingStaff.save();

      return res.status(200).json({
        message: 'Staff profile image updated successfully!',
        staff: {
          id: existingStaff._id,
          profileImage: existingStaff.profileImage,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];

// Staff Controller (UPDATE Staff Profile Image)
export const editStaffProfile = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const staffId = req.params.staffId; // Get staffId from params

      // Check if the staff exists by staffId
      const existingStaff = await Staff.findById(staffId);

      if (!existingStaff) {
        return res.status(404).json({ message: 'Staff not found!' });
      }

      // If a profile image is uploaded, update the profileImage field
      const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : existingStaff.profileImage;

      // Update the staff's profile image
      existingStaff.profileImage = profileImage;

      // Save the updated staff to the database
      await existingStaff.save();

      return res.status(200).json({
        message: 'Staff profile image updated successfully!',
        staff: {
          id: existingStaff._id,
          profileImage: existingStaff.profileImage,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];

// Staff Controller (GET Staff Profile)
export const getStaffProfile = async (req, res) => {
  try {
    const staffId = req.params.id;  // Get the staff ID from request params

    // Find staff by ID
    const staff = await Staff.findById(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff not found!' });
    }

    return res.status(200).json({
      id: staff._id,
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      profileImage: staff.profileImage || 'default-profile-image.jpg', // Include profile image (or default if none)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


