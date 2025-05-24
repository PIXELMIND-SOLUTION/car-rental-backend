import express from 'express';
import { 
    registerStaff, 
    loginStaff, 
    getStaff, 
    updateStaff,
    createStaffProfile, 
    editStaffProfile,
    getAllBookings,
    getTodaysBookings,
    getBookingStatistics,
    getBookingsByDate, 
 } from '../Controller/StaffController.js'; // Import StaffController

const router = express.Router();

// Staff Registration Route
router.post('/register', registerStaff);

// Staff Login Route (OTP generation)
router.post('/login', loginStaff);

// Staff OTP Verification Route
router.get('/get-staff/:id', getStaff);
router.put('/update-staff/:id', updateStaff);

// Routes for Staff Profile
router.post('/create-profile/:staffId', createStaffProfile);  // Create or update profile image
router.put('/update-profile/:staffId', editStaffProfile);    // Edit profile image
router.get('/allbookings', getAllBookings);
router.get('/todaybookings', getTodaysBookings);
router.get('/bookingsbydate', getBookingsByDate);
router.get('/staticsbookings', getBookingStatistics);


export default router;
