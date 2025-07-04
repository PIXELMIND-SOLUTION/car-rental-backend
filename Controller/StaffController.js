import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import Staff from '../Models/Staff.js';
import multer from 'multer'; // Import multer for file handling
import path from 'path';  // To resolve file paths
import Booking from '../Models/Booking.js';
import cloudinary from '../config/cloudinary.js';
import User from '../Models/User.js';
import puppeteer from 'puppeteer';
import twilio from 'twilio';
import ejs from 'ejs';
import fs from 'fs';
import { fileURLToPath } from 'url';




// Twilio credentials (store in .env ideally)
const accountSid = 'AC6dbc0f86b6481658d4b4bc471d1dfb32';
const authToken = '724cbf82d7e3c8a0462efb98ba713d4a';
const twilioPhone = '+19123489710';


// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = twilio(accountSid, authToken);

// 🔢 Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

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
    const staff = await Staff.findOne({ mobile });

    if (!staff) {
      return res.status(404).json({ error: "Mobile number is not registered" });
    }

    // 🔐 Generate 4-digit OTP
    const otp = generateOTP();

    // ⏳ Set OTP expiry to 30 seconds from now
    const expiry = Date.now() + 30 * 1000;
    staff.otp = otp;
    staff.otpExpires = expiry;
    await staff.save();

    // 📲 Send OTP via Twilio
    const message = await client.messages.create({
      body: `Your OTP is ${otp}. It is valid for 30 seconds.`,
      from: twilioPhone,
      to: `+91${mobile}`
    });

    console.log(`OTP sent to ${mobile}: SID ${message.sid}`);

    return res.status(200).json({
      message: "OTP sent successfully",
      otp, // For dev/testing; remove in production
      expiresIn: 30,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        profileImage: staff.profileImage || 'default-profile.jpg',
      }
    });

  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(500).json({ error: "Failed to send OTP", details: error.message });
  }
};


// 🔁 Resend OTP for Staff
export const resendStaffOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const staff = await Staff.findOne({ mobile });

    if (!staff) {
      return res.status(404).json({ error: "Mobile number is not registered" });
    }

    // 🕒 Optional Cooldown Check: Don’t allow resend if last OTP still active
    if (staff.otpExpires && Date.now() < staff.otpExpires - 15000) {
      return res.status(429).json({ error: "Please wait a few seconds before requesting another OTP." });
    }

    // 🔐 Generate new OTP
    const otp = generateOTP();
    const expiry = Date.now() + 30 * 1000; // 30 seconds

    // Save new OTP
    staff.otp = otp;
    staff.otpExpires = expiry;
    await staff.save();

    // 📲 Send OTP via Twilio
    const message = await client.messages.create({
      body: `Your new OTP is ${otp}. It is valid for 30 seconds.`,
      from: twilioPhone,
      to: `+91${mobile}`
    });

    console.log(`Resent OTP to ${mobile}: SID ${message.sid}`);

    return res.status(200).json({
      message: "OTP resent successfully",
      otp, // ⚠️ For dev/testing only — remove in production
      expiresIn: 30,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        profileImage: staff.profileImage || 'default-profile.jpg',
      }
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ error: "Failed to resend OTP", details: error.message });
  }
};



export const verifyStaffOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    // 🔍 Find staff with matching OTP and valid expiry
    const staff = await Staff.findOne({
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!staff) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // ✅ Clear OTP fields
    staff.otp = null;
    staff.otpExpires = null;
    await staff.save();

    // 🔐 Generate JWT token for authenticated session
    const token = jwt.sign({ id: staff._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      staff: {
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        mobile: staff.mobile,
        profileImage: staff.profileImage || 'default-profile.jpg',
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      }
    });

  } catch (error) {
    console.error("OTP verification failed:", error);
    return res.status(500).json({ error: "Internal server error" });
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

export const editStaffProfile = async (req, res) => {
  try {
    const staffId = req.params.staffId;

    if (!staffId) {
      return res.status(400).json({ message: 'staffId is required' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found!' });
    }

    // Check if profileImage is uploaded
    if (!req.files || !req.files.profileImage) {
      return res.status(400).json({ message: 'No profile image uploaded' });
    }

    const file = req.files.profileImage;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'staff-profile-images',
    });

    // Save image URL to staff profile
    staff.profileImage = result.secure_url;

    await staff.save();

    return res.status(200).json({
      message: 'Staff profile image updated successfully!',
      staff: {
        id: staff._id,
        profileImage: staff.profileImage,
      },
    });
  } catch (error) {
    console.error('Error updating staff profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

    const formattedBookings = bookings.map((booking) => {
      const car = booking.carId;

      return {
        _id: booking._id,
        userId: booking.userId,
        carId: car ? car._id : null,
        rentalStartDate: booking.rentalStartDate,
        rentalEndDate: booking.rentalEndDate,
        from: booking.from,
        to: booking.to,
        totalPrice: booking.totalPrice,
        total: booking.total,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        transactionId: booking.transactionId,
        otp: booking.otp,
        returnOTP: booking.returnOTP,
        depositPDF: booking.depositPDF,
        finalBookingPDF: booking.finalBookingPDF,
        advancePaidStatus: booking.advancePaidStatus,
        deposit: booking.deposit,
        returnDetails: booking.returnDetails,
        carImagesBeforePickup: booking.carImagesBeforePickup,
        carReturnImages: booking.carReturnImages,
        delayedPaymentProof: booking.delayedPaymentProof,
        pickupLocation: car ? car.location : null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      car: car
  ? {
      _id: car._id,
      carName: car.carName,
      model: car.model,
      year: car.year,
      pricePerHour: car.pricePerHour,
      pricePerDay: car.pricePerDay,
      extendedPrice: {
        perHour: car.extendedPrice?.perHour,
        perDay: car.extendedPrice?.perDay,
      },
      description: car.description,
      delayPerHour: car.delayPerHour,
      delayPerDay: car.delayPerDay,
      vehicleNumber: car.vehicleNumber,
      availability: car.availability,
      location: car.location,
      carType: car.carType,
      fuel: car.fuel,
      branch: {
        name: car.branch?.name,
        location: car.branch?.location,
      },
      seats: car.seats,
      type: car.type,
      status: car.status,
      carImage: car.carImage,
      carDocs: car.carDocs,
      runningStatus: car.runningStatus,
    }
  : null

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
    let queryDate;

    if (req.query.date) {
      // Expecting date in yyyy/mm/dd format
      const parts = req.query.date.split('/'); // ["2025", "06", "08"]

      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months 0-based
        const day = parseInt(parts[2], 10);

        queryDate = new Date(year, month, day);

        if (isNaN(queryDate.getTime())) {
          return res.status(400).json({ message: 'Invalid date format. Use yyyy/mm/dd' });
        }
      } else {
        return res.status(400).json({ message: 'Invalid date format. Use yyyy/mm/dd' });
      }
    } else {
      queryDate = new Date(); // default today
    }

    const startOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate());
    const endOfDay = new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate(), 23, 59, 59, 999);

    const bookings = await Booking.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('userId', 'name email')
      .populate('carId');

    const formattedBookings = bookings.map((booking) => {
      return {
        _id: booking._id,
        userId: booking.userId,
        carId: booking.carId._id,
        rentalStartDate: booking.rentalStartDate,  // Directly using rentalStartDate
        rentalEndDate: booking.rentalEndDate,      // Directly using rentalEndDate
        from: booking.from,                        // Directly using booking.from
        to: booking.to,                            // Directly using booking.to
        totalPrice: booking.totalPrice,
        total: booking.total,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        transactionId: booking.transactionId,
        otp: booking.otp,
        deposit: booking.deposit,
        delayedPaymentProof: booking.delayedPaymentProof,
        pickupLocation: booking.carId.location || null,
        deliveryDate: booking.deliveryDate,
      deliveryTime: booking.deliveryTime,
      extensions: Array.isArray(booking.extensions)
        ? booking.extensions.map((ext) => ({
            hours: ext.hours,
            amount: ext.amount,
            transactionId: ext.transactionId,
            _id: ext._id,
            extendedAt: ext.extendedAt,
          }))
        : [],
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
      message: `Bookings for ${startOfDay.toLocaleDateString('en-US')} retrieved successfully`,
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getSingleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email mobile documents')
      .populate('carId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const user = booking.userId;
    const car = booking.carId;

    const formattedBooking = {
      _id: booking._id,
      userId: user ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        documents: {
          aadharCard: user.documents?.aadharCard || null,
          drivingLicense: user.documents?.drivingLicense || null,
        },
      } : null,
      carId: car?._id || null,
      rentalStartDate: booking.rentalStartDate,
      rentalEndDate: booking.rentalEndDate,
      from: booking.from,
      to: booking.to,
      totalPrice: booking.totalPrice,
      total: booking.total,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      transactionId: booking.transactionId,
      otp: booking.otp,
      returnOTP: booking.returnOTP,
      deposit: booking.deposit,
      pickupLocation: car?.location || null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      returnDetails: Array.isArray(booking.returnDetails) ? booking.returnDetails : [],
      depositeProof: Array.isArray(booking.depositeProof) ? booking.depositeProof : [],
      carImagesBeforePickup: Array.isArray(booking.carImagesBeforePickup) ? booking.carImagesBeforePickup : [],
      carReturnImages: Array.isArray(booking.carReturnImages) ? booking.carReturnImages : [],
      depositPDF: booking.depositPDF,
      finalBookingPDF: booking.finalBookingPDF,
      deliveryDate: booking.deliveryDate,
      deliveryTime: booking.deliveryTime,
      extensions: Array.isArray(booking.extensions)
        ? booking.extensions.map((ext) => ({
            hours: ext.hours,
            amount: ext.amount,
            transactionId: ext.transactionId,
            _id: ext._id,
            extendedAt: ext.extendedAt,
          }))
        : [],
      car: car ? {
        _id: car._id,
        carName: car.carName,
        model: car.model,
        year: car.year,
        pricePerHour: car.pricePerHour,
        pricePerDay: car.pricePerDay,
        extendedPrice: car.extendedPrice,
        delayPerHour: car.delayPerHour,
        delayPerDay: car.delayPerDay,
        vehicleNumber: car.vehicleNumber,
        description: car.description,
        availabilityStatus: car.availabilityStatus,
        availability: car.availability,
        carImage: car.carImage,
        carDocs: car.carDocs,
        location: car.location,
        carType: car.carType,
        fuel: car.fuel,
        seats: car.seats,
        type: car.type,
        status: car.status,
      } : null,
    };

    return res.status(200).json({
      message: 'Booking retrieved successfully',
      booking: formattedBooking,
    });

  } catch (err) {
    console.error('Error fetching booking:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};




// ✅ Helper function to generate 4-digit return OTP
const generateReturnOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateStyledPDF = async (user, booking) => {
  const fileName = `booking_${booking._id}.pdf`;
  const outputPath = path.join('uploads', fileName);

  // Render EJS HTML
  const html = await ejs.renderFile(path.join('views', 'booking-pdf.ejs'), {
    user,
    booking,
  });

  // Launch Puppeteer with safe flags
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();

  return `/uploads/${fileName}`;
};


export const verifyBookingOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const booking = await Booking.findById(bookingId).populate('userId', 'name email mobile documents');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    booking.status = 'active';
    booking.returnOTP = generateReturnOTP(); // ✅ function to generate return OTP

    const user = booking.userId;

    // ✅ Generate and upload PDF, get URL
    const pdfUrl = await generateStyledPDF(user, booking);

    booking.depositPDF = pdfUrl; // ✅ Save PDF URL
    await booking.save();

    return res.status(200).json({
      message: 'OTP verified successfully. Booking is now active.',
      bookingId: booking._id,
      status: booking.status,
      returnOTP: booking.returnOTP,
      depositPDF: booking.depositPDF,
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getActiveBookings = async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (date) {
      const startOfDay = new Date(date + 'T00:00:00.000Z');
      const endOfDay = new Date(date + 'T23:59:59.999Z');
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email mobile documents')
      .populate('carId');

    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      userId: booking.userId
        ? {
            _id: booking.userId._id,
            name: booking.userId.name,
            email: booking.userId.email,
            mobile: booking.userId.mobile,
            documents: {
              aadharCard: booking.userId.documents?.aadharCard || null,
              drivingLicense: booking.userId.documents?.drivingLicense || null,
            },
          }
        : {},
      carId: booking.carId ? booking.carId._id : null,
      rentalStartDate: booking.rentalStartDate,
      rentalEndDate: booking.rentalEndDate,
      from: booking.from,
      to: booking.to,
      totalPrice: booking.totalPrice,
      total: booking.total,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      otp: booking.otp,
      deposit: booking.deposit,
      delayedPaymentProof: booking.delayedPaymentProof,
      depositPDF: booking.depositPDF || null, // ✅ Include deposit PDF here
      finalBookingPDF: booking.finalBookingPDF || null, // ✅ NEW
      pickupLocation: booking.carId ? booking.carId.location : null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      returnDetails: Array.isArray(booking.returnDetails) ? booking.returnDetails : [],
      depositeProof: Array.isArray(booking.depositeProof) ? booking.depositeProof : [],
      carImagesBeforePickup: Array.isArray(booking.carImagesBeforePickup) ? booking.carImagesBeforePickup : [],
      carReturnImages: Array.isArray(booking.carReturnImages) ? booking.carReturnImages : [],
       deliveryDate: booking.deliveryDate,
      deliveryTime: booking.deliveryTime,
      extensions: Array.isArray(booking.extensions)
        ? booking.extensions.map((ext) => ({
            hours: ext.hours,
            amount: ext.amount,
            transactionId: ext.transactionId,
            _id: ext._id,
            extendedAt: ext.extendedAt,
          }))
        : [],
      car: booking.carId
        ? {
            _id: booking.carId._id,
            carName: booking.carId.carName,
            model: booking.carId.model,
            year: booking.carId.year,
            pricePerHour: booking.carId.pricePerHour,
            pricePerDay: booking.carId.pricePerDay,
            extendedPrice: booking.carId.extendedPrice,
            delayPerHour: booking.carId.delayPerHour,
            delayPerDay: booking.carId.delayPerDay,
            vehicleNumber: booking.carId.vehicleNumber,
            description: booking.carId.description,
            availabilityStatus: booking.carId.availabilityStatus,
            availability: booking.carId.availability,
            carImage: booking.carId.carImage,
            location: booking.carId.location,
            carType: booking.carId.carType,
            fuel: booking.carId.fuel,
            seats: booking.carId.seats,
            type: booking.carId.type,
            status: booking.carId.status,
          }
        : {},
    }));

    return res.status(200).json({
      message: 'Bookings retrieved successfully',
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};




export const getCompletedBookings = async (req, res) => {
  try {
    // Find bookings where status is 'completed'
    const bookings = await Booking.find({ status: 'completed' })
      .populate('userId', 'name email documents')
      .populate('carId');

    const formattedBookings = bookings.map(booking => {
      const rentalStart = new Date(booking.rentalStartDate);
      const rentalEnd = new Date(booking.rentalEndDate);

      const formatTime12Hour = (date) => {
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString('en-US', options);
      };

      return {
        _id: booking._id,
        userId: {
          _id: booking.userId._id,
          name: booking.userId.name,
          email: booking.userId.email,
          documents: {
            aadharCard: booking.userId.documents?.aadharCard || null,
            drivingLicense: booking.userId.documents?.drivingLicense || null,
          }
        },
        carId: booking.carId._id,
        rentalStartDate: rentalStart.toLocaleDateString('en-US'),
        rentalEndDate: rentalEnd.toLocaleDateString('en-US'),
        from: formatTime12Hour(rentalStart),
        to: formatTime12Hour(rentalEnd),
        totalPrice: booking.totalPrice,
        total: booking.total,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        otp: booking.otp,
        deposit: booking.deposit,
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
      message: 'Completed bookings retrieved successfully',
      bookings: formattedBookings,
    });

  } catch (err) {
    console.error('Error fetching completed bookings:', err);
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



export const getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.body;

    const selectedDate = date ? new Date(date) : new Date();

    // Set time range for the entire selected day
    const startOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    const endOfDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      23,
      59,
      59,
      999
    );

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
        total: booking.total,
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
      message: `Bookings for ${startOfDay.toDateString()} retrieved successfully`,
      bookings: formattedBookings,
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



// // Helper function to generate 4-digit OTP
// const generateReturnOTP = () => {
//   return Math.floor(1000 + Math.random() * 9000).toString(); // random 4 digit string
// };

export const sendReturnOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      name,
      email,
      mobile,
      alternativeMobile,
      returnTime,
      returnDate,
      delayTime,
      delayDay,
    } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email mobile documents')
      .populate('carId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Note: Only saving data, not generating OTP
    booking.returnDetails.push({
      name,
      email,
      mobile,
      alternativeMobile,
      returnTime,
      returnDate,
      delayTime,
      delayDay,
    });

    await booking.save();

    const formattedDelayTime = delayTime
      ? `${delayTime} ${delayTime == 1 ? 'hour' : 'hours'}`
      : '0 hours';

    const formattedDelayDay = delayDay
      ? `${delayDay} ${delayDay == 1 ? 'day' : 'days'}`
      : '0 days';

    return res.status(200).json({
      message: 'Return details submitted successfully',
      delay: {
        time: formattedDelayTime,
        day: formattedDelayDay,
      }
    });

  } catch (err) {
    console.error('Error in sendReturnOTP:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};




export const verifyReturnOTP = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { returnOTP } = req.body;

    if (!returnOTP) {
      return res.status(400).json({ message: 'Return OTP is required' });
    }

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email mobile documents')
      .populate('carId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status.toLowerCase() !== 'active') {
      return res.status(400).json({ message: 'Booking is not active or already completed' });
    }

    if (booking.returnOTP !== returnOTP) {
      return res.status(400).json({ message: 'Invalid return OTP' });
    }

    // ✅ Mark booking complete
    booking.status = 'completed';
    booking.returnOTP = null;

    // ✅ Generate final PDF and store link
    const pdfUrl = await generateFinalBookingPDF(booking);
    booking.finalBookingPDF = pdfUrl;

    await booking.save();

    return res.status(200).json({
      message: 'Return OTP verified, booking completed successfully',
      finalBookingPDF: pdfUrl,
      booking,
    });

  } catch (err) {
    console.error('Error verifying return OTP:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


async function generateFinalBookingPDF(booking) {
  const templatePath = path.join(__dirname, '../views/finalBookingSummary.ejs');

  const html = await ejs.renderFile(templatePath, {
    user: booking.userId,
    booking: {
      ...booking._doc,
      car: booking.carId,
    }
  });

  const browser = await puppeteer.launch({
  headless: 'new',
  timeout: 60000,
  args: ['--no-sandbox', '--disable-setuid-sandbox'] // ✅ this is critical when running as root
});

  const page = await browser.newPage();

  // Block unnecessary network requests (e.g., images, fonts)
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
      request.abort();  // Block the request
    } else {
      request.continue();
    }
  });

  // Set content and wait until the page loads
  await page.setContent(html, { waitUntil: 'networkidle2' });  // Adjust this if necessary

  const fileName = `final_booking_${booking._id}.pdf`;
  const outputPath = path.join(__dirname, '../uploads/finalbookingPdf', fileName);

  await page.pdf({ path: outputPath, format: 'A4' });
  await browser.close();

  // Return relative URL (remove base url)
  return `/uploads/finalbookingPdf/${fileName}`;
}



export const uploadDepositeProof = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const hasFront = req.files?.depositeFront;
    const hasBack = req.files?.depositeBack;

    if (!hasFront && !hasBack) {
      return res.status(400).json({ message: 'Please upload at least one deposit proof image (front or back).' });
    }

    const filesToUpload = [];

    if (hasFront) {
      const frontFiles = Array.isArray(hasFront) ? hasFront : [hasFront];
      filesToUpload.push(...frontFiles.map(file => ({ file, label: 'depositeFront' })));
    }

    if (hasBack) {
      const backFiles = Array.isArray(hasBack) ? hasBack : [hasBack];
      filesToUpload.push(...backFiles.map(file => ({ file, label: 'depositeBack' })));
    }

    const uploadedProofs = await Promise.all(
      filesToUpload.map(({ file, label }) =>
        cloudinary.uploader.upload(file.tempFilePath, {
          folder: 'deposits',
        }).then(uploadRes => ({
          url: uploadRes.secure_url,
          uploadedAt: new Date(),
          label,
        }))
      )
    );

    // Initialize array if empty
    if (!Array.isArray(booking.depositeProof)) {
      booking.depositeProof = [];
    }

    // Update existing proofs by replacing same label if present
    for (const newProof of uploadedProofs) {
      const existingIndex = booking.depositeProof.findIndex(p => p.label === newProof.label);
      if (existingIndex !== -1) {
        booking.depositeProof[existingIndex] = newProof;
      } else {
        booking.depositeProof.push(newProof);
      }
    }

    await booking.save();

    return res.status(200).json({
      message: 'Deposit proof uploaded/updated successfully',
      depositeProof: booking.depositeProof,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error uploading deposit proof',
      error: err.message,
    });
  }
};


export const uploadCarImagesBeforePickup = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const carImages = req.files?.carImages;

    if (!carImages) {
      return res.status(400).json({ message: 'No car images provided' });
    }

    const imagesArray = Array.isArray(carImages) ? carImages : [carImages];

    // Upload all images
    const uploadedImages = await Promise.all(
      imagesArray.map((img, index) =>
        cloudinary.uploader.upload(img.tempFilePath, {
          folder: 'car-pickup-images',
        }).then(uploadRes => ({
          url: uploadRes.secure_url,
          uploadedAt: new Date(),
          label: `image_${index + 1}`, // optional: label per image
        }))
      )
    );

    // Initialize array if needed
    if (!Array.isArray(booking.carImagesBeforePickup)) {
      booking.carImagesBeforePickup = [];
    }

    // Optional: Replace all images every time (you can change this behavior)
    booking.carImagesBeforePickup = uploadedImages;

    await booking.save();

    return res.status(200).json({
      message: 'Car images uploaded/updated successfully before pickup',
      carImagesBeforePickup: booking.carImagesBeforePickup,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error uploading car images',
      error: err.message,
    });
  }
};


// 2. uploadCarReturnImages - images upload karne ke baad OTP generate kare aur bheje
export const uploadCarReturnImages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if files are provided
    if (!req.files || !req.files.carReturnImages) {
      return res.status(400).json({ message: 'No car return images provided' });
    }

    const images = Array.isArray(req.files.carReturnImages)
      ? req.files.carReturnImages
      : [req.files.carReturnImages];

    // Upload images to Cloudinary
    const uploaded = await Promise.all(
      images.map((img) =>
        cloudinary.uploader.upload(img.tempFilePath, {
          folder: 'car-return-images',
        }).then(res => ({
          url: res.secure_url,
          uploadedAt: new Date()
        }))
      )
    );

    // Push uploaded image info to booking.carReturnImages
    booking.carReturnImages.push(...uploaded);

    // Generate OTP here and save in booking
    const returnOTP = generateReturnOTP();
    booking.returnOTP = returnOTP;

    await booking.save();

    return res.status(200).json({
      message: 'Car return images uploaded successfully',
      carReturnImages: booking.carReturnImages,
      returnOTP // OTP yaha response me bhej rahe hain
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error uploading return images', error: err.message });
  }
}


export const uploadUserDocumentsByStaff = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasAadhar = req.files?.aadharCard;
    const hasLicense = req.files?.drivingLicense;

    if (!hasAadhar && !hasLicense) {
      return res.status(400).json({
        message: 'Please upload at least Aadhar card or Driving License.',
      });
    }

    const uploadedDocs = {};

    if (hasAadhar) {
      const result = await cloudinary.uploader.upload(
        req.files.aadharCard.tempFilePath,
        { folder: 'user_documents/aadhar' }
      );

      uploadedDocs.aadharCard = {
        url: result.secure_url,
        uploadedAt: new Date(),
        status: 'pending',
      };
    }

    if (hasLicense) {
      const result = await cloudinary.uploader.upload(
        req.files.drivingLicense.tempFilePath,
        { folder: 'user_documents/license' }
      );

      uploadedDocs.drivingLicense = {
        url: result.secure_url,
        uploadedAt: new Date(),
        status: 'pending',
      };
    }

    // Merge or update the documents in the user model
    if (!user.documents) {
      user.documents = {};
    }

    for (const [key, value] of Object.entries(uploadedDocs)) {
      user.documents[key] = {
        ...(user.documents[key] || {}),
        ...value,
      };
    }

    await user.save();

    return res.status(200).json({
      message: 'Documents uploaded/updated successfully by staff',
      documents: user.documents,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error uploading documents',
      error: error.message,
    });
  }
};



export const uploadDelayedPaymentProof = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!req.files || !req.files.paymentScreenshot) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const screenshotFile = req.files.paymentScreenshot;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      screenshotFile.tempFilePath,
      { folder: 'payment-delays' }
    );

    booking.delayedPaymentProof = {
      url: result.secure_url,
      uploadedAt: new Date()
    };

    await booking.save();

    return res.status(200).json({
      message: 'Delayed payment proof uploaded successfully',
      delayedPaymentProof: booking.delayedPaymentProof,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error uploading delayed payment proof',
      error: error.message,
    });
  }
};





