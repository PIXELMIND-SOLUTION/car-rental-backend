import express from 'express';
import { 
    registerUser,
     loginUser, 
     getUser, 
     createProfile, 
     editProfileImage, 
     getProfile,
     createBooking,
     getUserBookings,
     getBookingSummary,
     getRecentBooking,
     extendBooking,
     addToWallet,
     getWalletTransactions,
     uploadUserDocuments,
     getUserDocuments,
     payForBooking,
     getReferralCode
    } from '../Controller/UserController.js'; // Import UserController

const router = express.Router();
import fileUpload from 'express-fileupload'

router.use(fileUpload({ useTempFiles: true }))



// Registration Route
router.post('/register', registerUser);

// Login Route
router.post('/login', loginUser);
// Get user details (GET)
router.get('/get-user/:userId', getUser);  // Adding a middleware to verify JWT token

// Update user details (PUT)
// Create a new profile with Form Data (including profile image)
router.post('/create-profile/:userId', createProfile);  // Profile creation with userId in params

// Edit the user profile by userId
router.put('/edit-profile/:userId', editProfileImage);  // Profile editing by userId

// Get the user profile by userId
router.get('/get-profile/:id', getProfile);  // Get profile by userId
router.post('/create-booking', createBooking);  // Get profile by userId
// Assuming you're using Express router
router.get('/bookings/:userId', getUserBookings);
router.get('/booking-summary/:userId/:bookingId', getBookingSummary);
router.post('/pay/:userId/:bookingId', payForBooking);
router.get('/recent-booking/:userId', getRecentBooking);
router.put('/extendbookings/:userId/:bookingId', extendBooking);

// Route to add amount to wallet
router.post('/addamount/:userId', addToWallet)
router.get('/getwallet/:userId', getWalletTransactions)
router.post('/uploaddocuments/:userId', uploadUserDocuments)
router.get('/documents/:userId', getUserDocuments)
router.get('/getreffercode/:userId', getReferralCode)











export default router;
