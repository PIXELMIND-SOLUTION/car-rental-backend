import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  mobile: {
    type: String,
    unique: true,
  },
   // ✅ New Fields for OTP
  otp: {
    type: String,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },
  profileImage: {
    type: String,
    default: 'default-profile-image.jpg', // Optional default image
  },
  address: String,
  role: { type: String, default: 'staff' }, // e.g., admin, manager, staff
  status: { type: String, default: 'active' }, // active/inactive
  createdBy: { type: String }, // admin who created
  // Any additional fields for staff can be added here (e.g. role, department)
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
