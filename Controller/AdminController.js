
import Admin from "../Models/Admin.js";
import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import User from "../Models/User.js";
import Staff from '../Models/Staff.js'
import Booking from "../Models/Booking.js";
import twilio from 'twilio';
import Notification from "../Models/Notification.js";



dotenv.config();


// Twilio credentials (store in .env ideally)
const accountSid = 'AC6dbc0f86b6481658d4b4bc471d1dfb32';
const authToken = '724cbf82d7e3c8a0462efb98ba713d4a';
const twilioPhone = '+19123489710';

const client = twilio(accountSid, authToken);

// 🔢 Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, mobile, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if admin already exists
    const adminExist = await Admin.findOne({ $or: [{ email }, { mobile }] });
    if (adminExist) {
      return res.status(400).json({ message: 'Admin with this email or mobile already exists!' });
    }

    // Create new admin without password hashing
    const newAdmin = new Admin({
      name,
      email,
      mobile,
      password, // Storing password as plain text (not recommended in production)
    });

    await newAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: newAdmin._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      message: 'Admin registered successfully',
      token,
      admin: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        mobile: newAdmin.mobile,
        createdAt: newAdmin.createdAt,
        updatedAt: newAdmin.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};




// Update Admin Controller (No bcrypt)
export const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const { password, confirmPassword, ...otherFields } = req.body;

    // If password fields are provided, validate them
    if ((password || confirmPassword) && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Include password only if it's being updated
    if (password) {
      otherFields.password = password;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { ...otherFields },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({
      message: 'Admin updated successfully',
      admin: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        mobile: updatedAdmin.mobile,
        password: updatedAdmin.password, // ⚠️ visible only for internal/testing use
        updatedAt: updatedAdmin.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const loginAdmin = async (req, res) => {
  const { mobile, password } = req.body;

  // Validate input
  if (!mobile || !password) {
    return res.status(400).json({ error: "Mobile number and password are required" });
  }

  try {
    // Find admin by mobile number
    const admin = await Admin.findOne({ mobile });

    if (!admin) {
      return res.status(404).json({ error: "Admin with this mobile number does not exist" });
    }

    // Compare password with plain text (no hashing)
    if (admin.password !== password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Login failed",
      details: error.message
    });
  }
};



// Get All Users Controller
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    return res.status(200).json({
      message: 'Users retrieved successfully!',
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profileImage: user.profileImage || 'default-profile-image.jpg',
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const {
      name,
      email,
      mobile,
      profileImage,
      aadharStatus,       // 👈 new input for aadharCard status
      licenseStatus       // 👈 new input for drivingLicense status
    } = req.body;

    // Prepare the update object dynamically
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(mobile && { mobile }),
      ...(profileImage && { profileImage }),
    };

    // Nested updates (documents)
    if (aadharStatus) {
      updateData['documents.aadharCard.status'] = aadharStatus;
    }

    if (licenseStatus) {
      updateData['documents.drivingLicense.status'] = licenseStatus;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({
      message: 'User updated successfully!',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        profileImage: updatedUser.profileImage || 'default-profile-image.jpg',
        aadharStatus: updatedUser.documents?.aadharCard?.status,
        licenseStatus: updatedUser.documents?.drivingLicense?.status
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};




// Delete User Controller
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({ message: 'User deleted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Get All Staff - Full Details
export const getAllStaff = async (req, res) => {
  try {
    const staffList = await Staff.find(); // No filtering or projection

    return res.status(200).json({
      message: 'All staff members retrieved successfully!',
      staff: staffList,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Update Staff Controller
// Update Staff Controller (All Fields)
export const updateStaff = async (req, res) => {
  try {
    const staffId = req.params.id;

    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      { ...req.body }, // Spread all fields
      { new: true }
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: 'Staff not found!' });
    }

    return res.status(200).json({
      message: 'Staff updated successfully!',
      staff: updatedStaff,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};




// Delete Staff Controller
export const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;

    const deletedStaff = await Staff.findByIdAndDelete(staffId);

    if (!deletedStaff) {
      return res.status(404).json({ message: 'Staff not found!' });
    }

    return res.status(200).json({ message: 'Staff deleted successfully!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Update booking status controller for Admin (no status validation)
export const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.bookingId; // booking ID from URL
    const { status } = req.body; // new status from request body

    // Find the booking by ID
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found!' });
    }

    // Update the status
    booking.status = status;

    // Save the updated booking
    await booking.save();

    return res.status(200).json({
      message: 'Booking status updated successfully!',
      booking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const updateBookingPaymentStatus = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const { paymentStatus, amount } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found!' });
    }

    // Update payment status
    if (paymentStatus) booking.paymentStatus = paymentStatus;

    // If amount is updated, update both amount and totalPrice
    if (amount !== undefined) {
      booking.amount = amount;
      booking.totalPrice = amount; // 👈 sync totalPrice with amount
    }

    // Save changes
    await booking.save();

    return res.status(200).json({
      message: 'Booking updated successfully!',
      booking,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Delete booking controller for Admin
export const deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId; // booking ID from URL

    // Find and delete the booking
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: 'Booking not found!' });
    }

    return res.status(200).json({
      message: 'Booking deleted successfully!',
      deletedBooking,
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;

    // Find admin by ID
    const admin = await Admin.findById(adminId).select('-__v'); // Remove __v field

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Send profile data
    return res.status(200).json({
      message: 'Admin profile fetched successfully',
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Update admin profile
export const updateAdminProfile = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { name, email, mobile } = req.body;

    // Find admin by ID and update
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { name, email, mobile },
      { new: true, runValidators: true, context: 'query' }
    ).select('-__v');

    if (!updatedAdmin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    return res.status(200).json({
      message: 'Admin profile updated successfully',
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const addStaffByAdmin = async (req, res) => {
  try {
    const { name, email, mobile, address, role, status } = req.body;

    // Check for existing staff with same email or mobile
    const staffExist = await Staff.findOne({ $or: [{ email }, { mobile }] });
    if (staffExist) {
      return res.status(400).json({ message: 'Staff with this email or mobile already exists!' });
    }

    // Create new staff (without OTP)
    const newStaff = new Staff({
      name,
      email,
      mobile,
      address,
      role: role || 'staff',
      status: status || 'active',
      createdBy: 'admin',
    });

    await newStaff.save();

    return res.status(201).json({
      success: true,
      message: 'Staff added successfully',
      staff: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        mobile: newStaff.mobile,
        role: newStaff.role,
        status: newStaff.status
      }
    });

  } catch (error) {
    console.error('Add Staff Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json({ notifications });
  } catch (err) {
    console.error("❌ Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};



export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const deleted = await Notification.findByIdAndDelete(notificationId);

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({
      message: 'Notification deleted successfully',
      notificationId,
    });
  } catch (err) {
    console.error("❌ Error deleting notification:", err);
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

