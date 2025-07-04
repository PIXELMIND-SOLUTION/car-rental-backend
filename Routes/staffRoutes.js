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
    getSingleBooking, 
    verifyBookingOtp,
    getActiveBookings,
    sendReturnOTP,
    verifyReturnOTP,
    getCompletedBookings,
    uploadDepositeProof,
    uploadCarImagesBeforePickup,
    uploadCarReturnImages,
    verifyStaffOtp,
    resendStaffOTP,
    uploadUserDocumentsByStaff,
    uploadDelayedPaymentProof
 } from '../Controller/StaffController.js'; // Import StaffController

const router = express.Router();

// Staff Registration Route
router.post('/register', registerStaff);

// Staff Login Route (OTP generation)
router.post('/login', loginStaff);
router.post("/resend-staff-otp", resendStaffOTP);
router.post('/verify-staff-otp', verifyStaffOtp); // Verify OTP

// Staff OTP Verification Route
router.get('/get-staff/:id', getStaff);
router.put('/update-staff/:id', updateStaff);

// Routes for Staff Profile
router.post('/create-profile/:staffId', createStaffProfile);  // Create or update profile image
router.put('/update-profile/:staffId',  editStaffProfile);    // Edit profile image
router.get('/allbookings', getAllBookings);
router.get('/singlebooking/:bookingId', getSingleBooking);
router.post('/verify-otp/:bookingId', verifyBookingOtp);
router.get('/activebookings', getActiveBookings);
router.get('/completedbookings', getCompletedBookings);
router.get('/todaybookings', getTodaysBookings);
router.get('/bookingsbydate', getBookingsByDate);
router.get('/staticsbookings', getBookingStatistics);
// Route to get single booking with return OTP (if active)
router.post('/sendreturnotp/:bookingId', sendReturnOTP);
router.post('/verify-return-otp/:bookingId', verifyReturnOTP);
router.post('/uploaddeposite/:bookingId', uploadDepositeProof);
router.post('/carimagesbeforepickup/:bookingId', uploadCarImagesBeforePickup);
router.post('/carreturnimages/:bookingId', uploadCarReturnImages);
// staffRoutes.js
router.post('/upload-documents/:userId', uploadUserDocumentsByStaff);
router.post('/upload-delaypaymentproof/:bookingId', uploadDelayedPaymentProof);



export default router;
