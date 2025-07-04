// models/Admin.js
import mongoose from 'mongoose';

// Define the schema
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
     password: {
    type: String,
  },
   confirmPassword: {
    type: String,
  },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Export the Admin model
const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
