import express from 'express';
import { registerAdmin, loginAdmin, getAllUsers, updateUser, deleteUser, getAllStaff, updateStaff, deleteStaff, updateBookingStatus, updateBookingPaymentStatus, deleteBooking, getAdminProfile, updateAdminProfile, addStaffByAdmin, updateAdmin, getAllNotifications, deleteNotification } from '../Controller/AdminController.js';

const router = express.Router();

// Routes
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/allusers', getAllUsers);
// UPDATE
router.put('/updateuser/:userId', updateUser);

// DELETE
router.delete('/deleteuser/:userId', deleteUser);
// READ
router.get('/getallstaffs', getAllStaff);       // Get all staff
router.put('/updatestaff/:id', updateStaff);    // Update staff by ID
router.delete('/deletestaff/:id', deleteStaff); // Delete staff by ID
router.put('/updateadmin/:id', updateAdmin);

router.put('/statusbookings/:bookingId', updateBookingStatus);
router.put('/payment-status/:bookingId', updateBookingPaymentStatus);
router.delete('/deletebooking/:bookingId', deleteBooking);
router.get('/profileadmin/:adminId', getAdminProfile);
router.put('/updateprofile/:adminId', updateAdminProfile);
router.post('/addstaff', addStaffByAdmin);
router.get('/allnotifications', getAllNotifications);
// routes/notification.js
router.delete('/deletenotification/:notificationId', deleteNotification);



export default router;
