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
  profileImage: {
    type: String,
    default: 'default-profile-image.jpg', // Optional default image
  },
  // Any additional fields for staff can be added here (e.g. role, department)
});

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
