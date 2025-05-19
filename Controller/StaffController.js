import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import Staff from '../Models/Staff.js';
import multer from 'multer'; // Import multer for file handling
import path from 'path';  // To resolve file paths
import Booking from '../Models/Booking.js';


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

export const loginStaff = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    // ✅ Check if staff exists
    const staff = await Staff.findOne({ mobile });

    // ❌ If not found, deny login
    if (!staff) {
      return res.status(404).json({ error: "Mobile number is not registered" });
    }

    // ✅ If found, allow login
    return res.status(200).json({
      message: "Staff login successful",
      staff,
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: "Failed to login", details: error.message });
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



export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('carId');

    const formattedBookings = bookings.map(booking => {
      const rentalStart = new Date(booking.rentalStartDate);
      const rentalEnd = new Date(booking.rentalEndDate);

      // Extract time (from/to) in 12-hour format
      const formatTime12Hour = (date) => {
        const options = {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        };
        return date.toLocaleTimeString('en-US', options);
      };

      const from = formatTime12Hour(rentalStart);
      const to = formatTime12Hour(rentalEnd);

      return {
        _id: booking._id,
        userId: booking.userId,
        carId: booking.carId._id,
        rentalStartDate: rentalStart.toLocaleDateString('en-US'),
        rentalEndDate: rentalEnd.toLocaleDateString('en-US'),
        from,
        to,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        otp: booking.otp,
        pickupLocation: booking.carId.location || null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        car: {
          _id: booking.carId._id,
          carName: booking.carId.carName,
          model: booking.carId.model,
          pricePerHour: booking.carId.pricePerHour,
          location: booking.carId.location,
          carImage: booking.carId.carImage,
        }
      };
    });

    return res.status(200).json({
      message: 'All bookings retrieved successfully',
      bookings: formattedBookings,
    });

  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ message: 'Error fetching bookings' });
  }
};



export const getTodaysBookings = async (req, res) => {
  try {
    const now = new Date();

    // Get start of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get end of today
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const bookings = await Booking.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('userId', 'name email')
      .populate('carId');

    const formattedBookings = bookings.map((booking) => {
      const rentalStart = new Date(booking.rentalStartDate);
      const rentalEnd = new Date(booking.rentalEndDate);

      const formatTime12Hour = (date) => {
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString('en-US', options);
      };

      return {
        _id: booking._id,
        userId: booking.userId,
        carId: booking.carId._id,
        rentalStartDate: rentalStart.toLocaleDateString('en-US'),
        rentalEndDate: rentalEnd.toLocaleDateString('en-US'),
        from: formatTime12Hour(rentalStart),
        to: formatTime12Hour(rentalEnd),
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        otp: booking.otp,
        pickupLocation: booking.carId.location || null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        car: {
          _id: booking.carId._id,
          carName: booking.carId.carName,
          model: booking.carId.model,
          pricePerHour: booking.carId.pricePerHour,
          location: booking.carId.location,
          carImage: booking.carId.carImage,
        },
      };
    });

    return res.status(200).json({
      message: 'Today’s bookings (based on createdAt) retrieved successfully',
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error('Error fetching today’s bookings:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getBookingStatistics = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Aggregate bookings by status and month
    const statistics = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'failed'] },
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            status: '$status',
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
      {
        $group: {
          _id: '$_id.status',
          monthlyCounts: {
            $push: {
              month: '$_id.month',
              count: '$count',
            },
          },
        },
      },
    ]);

    // Month names to map month number to actual month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Format the response to include all months for each status
    const formattedStats = ['completed', 'failed'].map((status) => {
      const monthlyCounts = statistics.find((stat) => stat._id === status)?.monthlyCounts || [];
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const existing = monthlyCounts.find((count) => count.month === month);
        return {
          month: monthNames[month - 1], // Mapping month number to month name
          count: existing ? existing.count : 0,
        };
      });

      return {
        status,
        monthlyData,
      };
    });

    return res.status(200).json({
      message: 'Booking statistics retrieved successfully',
      statistics: formattedStats,
    });
  } catch (err) {
    console.error('Error fetching booking statistics:', err);
    return res.status(500).json({ message: 'Error fetching booking statistics' });
  }
};


