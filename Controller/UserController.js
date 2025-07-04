import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import User from '../Models/User.js';
import Booking from '../Models/Booking.js';
import Car from '../Models/Car.js';
import cloudinary from '../config/cloudinary.js';
import Razorpay from 'razorpay';
import Notification from '../Models/Notification.js';
import mongoose from 'mongoose';

import nodemailer from 'nodemailer';

import twilio from "twilio";



dotenv.config();


// Twilio credentials
const accountSid = 'AC6dbc0f86b6481658d4b4bc471d1dfb32';
const authToken = '724cbf82d7e3c8a0462efb98ba713d4a'; // 🔒 Replace with actual
const twilioPhone = '+19123489710';

const client = twilio(accountSid, authToken);

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};



const generateReferralCode = () => {
  // Generate a random referral code (e.g., 6-character alphanumeric code)
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, code } = req.body;

    // Check if user already exists
    const userExist = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExist) {
      return res.status(400).json({ message: 'User with this email or mobile already exists!' });
    }

    // Generate random referral code for the new user
    const referralCode = generateReferralCode();

    // Create new user
    const newUser = new User({
      name,
      email,
      mobile,
      code: referralCode, // Save the generated referral code
    });

    // If the user has entered a referral code, validate it and apply points
    if (code) {
      const referrer = await User.findOne({ code });
      if (referrer) {
        // Reward the user and the referrer with points (or some other mechanism)
        newUser.referredBy = referrer._id; // Link to the referrer
        newUser.points = 50;  // New user gets 50 points
        referrer.points = (referrer.points || 0) + 50;  // Referrer gets 50 points as well

        // Save both the new user and the referrer with updated points
        await referrer.save();
      }
    }

    // Save the new user to the database
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    // Return the response
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// 📲 Send OTP + Login
export const loginUser = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ error: "User with this mobile number does not exist" });
    }

    const otp = generateOTP();
    const expiry = Date.now() + 30 * 1000; // 30 seconds

    // Send custom OTP SMS
    const message = `Hi ${user.name || "User"}, your OTP is ${otp}. It is valid for 30 seconds.`;

    await client.messages.create({
      body: message,
      from: twilioPhone,
      to: `+91${mobile}`,
    });

    // Save OTP and expiry
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();

    return res.status(200).json({
      message: "OTP sent successfully",
      mobile,
      otp, // ✅ include OTP for testing
      name: user.name || null,
      email: user.email || null,
      profileImage: user.profileImage || null,
    });

  } catch (error) {
    console.error("OTP send failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



// 📲 Resend OTP Controller
export const resendOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user) {
      return res.status(404).json({ error: "User with this mobile number does not exist" });
    }

    // Optional cooldown logic (e.g., prevent resend before 15 seconds)
    if (user.otpExpires && Date.now() < user.otpExpires - 15000) {
      return res.status(429).json({ error: "Please wait a few seconds before requesting another OTP." });
    }

    const otp = generateOTP(); // Generate 6-digit OTP
    const expiry = Date.now() + 30 * 1000; // 30 seconds validity

    const message = `Hi ${user.name || "User"}, your new OTP is ${otp}. It is valid for 30 seconds.`;

    // Send SMS via Twilio
    await client.messages.create({
      body: message,
      from: twilioPhone,
      to: `+91${mobile}`,
    });

    // Update OTP and expiry
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();

    return res.status(200).json({
      message: "OTP resent successfully",
      mobile,
      otp, // ⚠️ Only for testing – remove in production
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};






export const verifyOtp = async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    // Find user by OTP
    const user = await User.findOne({ otp });

    if (!user) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ error: "OTP expired. Please request again." });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        mobile: user.mobile,
        code: user.code || null,
        profileImage: user.profileImage || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });

  } catch (error) {
    console.error("OTP verification failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};





export const getUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Populate myBookings with Booking model
    const user = await User.findById(userId).populate({
      path: "myBookings",
      model: "Booking"
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      otp: user.otp,
      wallet: user.wallet,
      totalWalletAmount: user.totalWalletAmount,
      referredBy: user.referredBy,
      points: user.points,
      code: user.code,
      profileImage: user.profileImage || "default-profile-image.jpg",
      documents: user.documents,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      myBookings: user.myBookings, // Populated data here
    };

    return res.status(200).json({
      message: "User details retrieved successfully!",
      user: userDetails,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const createProfile = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from request params

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Check if a file is uploaded
    if (!req.files || !req.files.profileImage) {
      return res.status(400).json({ message: 'No file uploaded!' });
    }

    // Get the uploaded file (profileImage)
    const profileImage = req.files.profileImage;

    // Upload the profile image to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(profileImage.tempFilePath, {
      folder: 'poster', // Cloudinary folder where images will be stored
    });

    // Save the uploaded image URL to the user's profile
    existingUser.profileImage = uploadedImage.secure_url;

    // Save the updated user data to the database
    await existingUser.save();

    // Respond with the updated user profile
    return res.status(200).json({
      message: 'Profile image uploaded successfully!',
      user: {
        id: existingUser._id,
        profileImage: existingUser.profileImage,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
// Update Profile Image (with userId in params)
export const editProfileImage = async (req, res) => {
  try {
    const { userId } = req.params; // Get the userId from request params

    // Check if the user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found!' });
    }

    // Check if a new file is uploaded
    if (!req.files || !req.files.profileImage) {
      return res.status(400).json({ message: 'No new file uploaded!' });
    }

    const newProfileImage = req.files.profileImage;

    // OPTIONAL: Delete previous image from Cloudinary if you stored public_id
    // You can store public_id during upload for this purpose

    // Upload the new image to Cloudinary
    const uploadedImage = await cloudinary.uploader.upload(newProfileImage.tempFilePath, {
      folder: 'poster',
    });

    // Update the profileImage field with new URL
    existingUser.profileImage = uploadedImage.secure_url;

    // Save updated user
    await existingUser.save();

    // Respond
    return res.status(200).json({
      message: 'Profile image updated successfully!',
      user: {
        id: existingUser._id,
        profileImage: existingUser.profileImage,
      },
    });

  } catch (error) {
    console.error('Error updating profile image:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get Profile (with userId in params)
export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;  // Get the user ID from request params

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_hNwWuDNHuEICmT',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'haiixCtWn3RTXzUWAwZJSQjg'
});

export const createBooking = async (req, res) => {
  try {
    const {
      userId,
      carId,
      rentalStartDate,
      rentalEndDate,
      from,
      to,
      deposit,
      amount,
      transactionId // Razorpay payment ID from frontend
    } = req.body;

    // 1️⃣ Validate car
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    if (car.runningStatus === 'Booked') {
      return res.status(409).json({ message: 'Car already booked' });
    }

    // 2️⃣ Fetch payment
    let paymentInfo = await razorpay.payments.fetch(transactionId);
    if (!paymentInfo) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 3️⃣ If only authorized, capture manually
    if (paymentInfo.status === "authorized") {
      try {
        await razorpay.payments.capture(transactionId, amount * 100, "INR");
        paymentInfo = await razorpay.payments.fetch(transactionId); // refresh status
      } catch (err) {
        console.error("❌ Payment capture failed:", err);
        return res.status(500).json({ message: "Payment capture failed" });
      }
    }

    // 4️⃣ Check final status
    if (paymentInfo.status !== "captured") {
      return res.status(400).json({ message: `Payment not captured. Status: ${paymentInfo.status}` });
    }

    // 5️⃣ Proceed with booking
    const otp = Math.floor(1000 + Math.random() * 9000);

    const newBooking = new Booking({
      userId,
      carId,
      rentalStartDate,
      rentalEndDate,
      from,
      to,
      deposit: deposit || '',
      totalPrice: amount,
      amount,
      otp,
      transactionId,
      paymentStatus: 'Paid',
      deliveryDate: rentalEndDate,
      deliveryTime: to,
      status: 'confirmed'
    });

    await newBooking.save();

    // 6️⃣ Update car status
    car.runningStatus = 'Booked';
    car.bookingDetails = {
      rentalStartDate,
      rentalEndDate
    };
    await car.save();

    // 7️⃣ Link booking to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.myBookings.push(newBooking._id);
    await user.save();


    // 🔔 Store short notification in DB
    const message = `🚗 ${car.title || car.model} booked by ${user.name} at ${new Date().toLocaleString()}`;
    const notification = new Notification({
      message,
      type: "booking"
    });

    await notification.save();


    return res.status(201).json({
      message: "Booking confirmed",
      booking: newBooking
    });

  } catch (err) {
    console.error("❌ Error in createBooking:", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


export const payForBooking = async (req, res) => {
  const { userId, bookingId } = req.params;

  if (!userId || !bookingId) {
    return res.status(400).json({ message: 'User ID and Booking ID are required' });
  }

  try {
    const user = await User.findById(userId);
    const booking = await Booking.findById(bookingId).populate('carId');

    if (!user || !booking) {
      return res.status(404).json({ message: 'User or booking not found' });
    }

    if (booking.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    const totalWalletBalance = user.wallet.reduce((acc, txn) =>
      txn.type === 'credit' ? acc + txn.amount : acc - txn.amount
      , 0);

    if (totalWalletBalance < booking.totalPrice) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct wallet
    const txn = {
      amount: booking.totalPrice,
      type: 'debit',
      message: `Payment for booking of car: ${booking.carId?.carName || 'N/A'}`,
      totalWalletAmount: totalWalletBalance - booking.totalPrice
    };

    user.wallet.push(txn);
    booking.paymentStatus = 'Paid';

    await user.save();
    await booking.save();

    return res.status(200).json({
      message: 'Payment successful',
      walletTransaction: txn,
      updatedBooking: booking
    });

  } catch (error) {
    console.error('Error in payForBooking:', error);
    return res.status(500).json({ message: 'Payment failed', error: error.message });
  }
};



export const getUserBookings = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.query; // status filter from query params

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Base query: always filter by userId in Booking model directly
    const query = { userId };

    // If status is passed in query, add it to the query object
    if (status) {
      query.status = status;
    }

    // Find bookings with optional status filtering
    const bookings = await Booking.find(query)
      .populate('carId') // Car details populated
      .sort({ createdAt: -1 }); // Optional: latest bookings first

    return res.status(200).json({
      message: 'Bookings fetched successfully',
      bookings
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};



export const getBookingSummary = async (req, res) => {
  const { userId, bookingId } = req.params;

  if (!userId || !bookingId) {
    return res.status(400).json({ message: 'User ID and Booking ID are required' });
  }

  try {
    // Fetch the booking details with car info and user info
    const booking = await Booking.findOne({ _id: bookingId, userId })
      .populate('carId') // Populate car info
      .populate('userId', 'name email mobile') // Populate user info
      .exec();

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Format the rental start and end dates
    const formattedStart = new Date(booking.rentalStartDate).toLocaleString('en-US');
    const formattedEnd = new Date(booking.rentalEndDate).toLocaleString('en-US');

    // Fetch the car details from the populated carId
    const car = booking.carId;

    return res.status(200).json({
      message: 'Booking summary fetched successfully',
      booking: {
        _id: booking._id,
        userId: booking.userId,
        carId: booking.carId._id,
        rentalStartDate: formattedStart,
        rentalEndDate: formattedEnd,
        totalPrice: booking.totalPrice,
        amount: booking.amount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        delayedPaymentProof: booking.delayedPaymentProof,
        otp: booking.otp,
        deliveryDate: booking.deliveryDate,
        deliveryTime: booking.deliveryTime,
        pickupLocation: car.location || null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      },
      car: {
        _id: car._id,
        carName: car.carName,
        brand: car.brand,
        model: car.model,
        pricePerHour: car.pricePerHour,
        location: car.location,
        carImage: car.carImage, // Return car images array
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error fetching booking summary',
      error: error.message
    });
  }
};




// Get Recent Booking Controller
export const getRecentBooking = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // Find the most recent booking for the given userId
    const booking = await Booking.findOne({ userId })
      .populate('carId') // populate car details
      .sort({ createdAt: -1 }) // Sort to get the most recent booking
      .exec();

    if (!booking) {
      return res.status(404).json({ message: 'No recent booking found' });
    }

    return res.status(200).json({
      message: 'Recent booking fetched successfully',
      booking
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error fetching recent booking',
      error: error.message
    });
  }
};


export const extendBooking = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;
    const {
      extendDeliveryDate,
      extendDeliveryTime,
      hours,
      amount,
      transactionId
    } = req.body;

    // 0️⃣ Validate payment for extension
    let paymentInfo = await razorpay.payments.fetch(transactionId);
    if (!paymentInfo) return res.status(404).json({ message: "Payment not found" });

    if (paymentInfo.status === "authorized") {
      try {
        await razorpay.payments.capture(transactionId, Number(amount) * 100, "INR");
        paymentInfo = await razorpay.payments.fetch(transactionId);
      } catch (err) {
        console.error("❌ Extension payment capture failed:", err);
        return res.status(500).json({ message: "Extension payment capture failed" });
      }
    }

    if (paymentInfo.status !== "captured") {
      return res.status(400).json({ message: `Extension payment not captured. Status: ${paymentInfo.status}` });
    }

    // 1️⃣ Find booking
    const booking = await Booking.findById(bookingId).populate('carId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Calculate old end time
    const [tPart, period] = booking.to.split(' ');
    let [hr, min] = tPart.split(':').map(p => parseInt(p));
    if (period === 'PM' && hr !== 12) hr += 12;
    if (period === 'AM' && hr === 12) hr = 0;
    const oldEndTime = new Date(`${booking.rentalEndDate}T${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`);

    // 2️⃣ Calculate new end time
    let newEndTime;
    if (hours && !isNaN(hours)) {
      newEndTime = new Date(oldEndTime.getTime() + Number(hours) * 60 * 60 * 1000);
    } else if (extendDeliveryDate && extendDeliveryTime) {
      const [etPart, ePeriod] = extendDeliveryTime.split(' ');
      let [ehr, emin] = etPart.split(':').map(p => parseInt(p));
      if (ePeriod === 'PM' && ehr !== 12) ehr += 12;
      if (ePeriod === 'AM' && ehr === 12) ehr = 0;
      newEndTime = new Date(`${extendDeliveryDate}T${ehr.toString().padStart(2, '0')}:${emin.toString().padStart(2, '0')}:00`);
    } else {
      return res.status(400).json({ message: 'Provide either hours or extendDeliveryDate + extendDeliveryTime' });
    }

    if (newEndTime <= oldEndTime) {
      return res.status(400).json({ message: 'New time must be after current end time' });
    }

    // 3️⃣ Validate amount
    const extraCost = Number(amount);
    if (isNaN(extraCost) || extraCost <= 0) {
      return res.status(400).json({ message: 'Invalid amount provided' });
    }

    const currentTotal = Number(booking.totalPrice);

    // 4️⃣ Update booking with new date, time, totalPrice, and saved transaction
    const newDateStr = newEndTime.toISOString().split('T')[0];
    const newTimeStr = newEndTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Update only rentalEndDate and to (end time)
    booking.rentalEndDate = newDateStr;
    booking.to = newTimeStr;

    // Keep deliveryDate and deliveryTime as is (do NOT update)
    // booking.deliveryDate = booking.deliveryDate;
    // booking.deliveryTime = booking.deliveryTime;

    booking.totalPrice = currentTotal + extraCost;
    booking.transactionId = transactionId;

    booking.extensions = booking.extensions || [];
    booking.extensions.push({
      extendDeliveryDate,
      extendDeliveryTime,
      hours,
      amount: extraCost,
      transactionId
    });

    await booking.save();

    return res.status(200).json({
      message: 'Booking extended successfully',
      extension: {
        extendDeliveryDate,
        extendDeliveryTime,
        hours,
        amount: extraCost,
        transactionId
      }
    });

  } catch (err) {
    console.error('Extend Booking Error:', err);
    return res.status(500).json({ message: 'Error extending booking' });
  }
};





export const addToWallet = async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;

  // Validate the amount input
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate the new total wallet amount by adding the new credit amount
    const newTotalWalletAmount = user.totalWalletAmount + Number(amount);

    // Create a new transaction object
    const newTransaction = {
      amount: Number(amount),
      type: 'credit', // Assuming you're adding money to the wallet (credit)
      message: 'Paid To Wallet',
      date: new Date()
    };

    // Add the new transaction to the user's wallet
    user.wallet.push(newTransaction);

    // Update the total wallet amount in the user's schema
    user.totalWalletAmount = newTotalWalletAmount;

    // Save the user document with the updated wallet and totalWalletAmount
    await user.save();

    // Return the response with the updated wallet and transaction details
    res.json({
      message: 'Amount added to wallet',
      totalWalletAmount: user.totalWalletAmount,  // The updated total wallet amount
      wallet: user.wallet
    });
  } catch (err) {
    console.error('Error in adding to wallet:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



export const getWalletTransactions = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'We couldn\'t find a user with that ID. Please try again.' });

    // Return the wallet transactions and the total wallet amount
    res.status(200).json({
      message: 'Wallet transactions fetched successfully.',
      totalWalletAmount: user.totalWalletAmount, // Include the total wallet balance
      wallet: user.wallet // Include the list of transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong while fetching your wallet details. Please try again later.' });
  }
};




export const uploadUserDocuments = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasAadhar = req.files?.aadharCard;
    const hasLicense = req.files?.drivingLicense;

    // ✅ Count already uploaded documents
    const alreadyUploadedDocs = Object.entries(user.documents || {}).filter(
      ([key, value]) => value?.url
    );

    if (alreadyUploadedDocs.length >= 2) {
      return res.status(400).json({
        message: 'You have already uploaded 2 documents. Upload limit reached.',
      });
    }

    // ✅ Validation: At least one new document must be uploaded
    if (!hasAadhar && !hasLicense) {
      return res.status(400).json({
        message: 'Please upload at least Aadhar card or Driving License.',
      });
    }

    // ✅ Count how many are being uploaded now
    const toUploadCount = (hasAadhar ? 1 : 0) + (hasLicense ? 1 : 0);

    // ✅ Total after this upload must not exceed 2
    if (alreadyUploadedDocs.length + toUploadCount > 2) {
      return res.status(400).json({
        message: `You can only upload 2 documents. You already uploaded ${alreadyUploadedDocs.length}.`,
      });
    }

    const updatedDocs = {};

    if (hasAadhar) {
      const result = await cloudinary.uploader.upload(
        req.files.aadharCard.tempFilePath,
        { folder: 'user_documents/aadhar' }
      );
      updatedDocs['documents.aadharCard'] = {
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
      updatedDocs['documents.drivingLicense'] = {
        url: result.secure_url,
        uploadedAt: new Date(),
        status: 'pending',
      };
    }

    // ⬆️ Update only fields that are being uploaded
    await User.updateOne({ _id: userId }, { $set: updatedDocs });

    const updatedUser = await User.findById(userId);

    return res.status(200).json({
      message: 'Documents uploaded successfully',
      documents: updatedUser.documents,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      message: 'Error uploading documents',
      error: error.message,
    });
  }
};




export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.params.userId

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (!user.documents || (Object.keys(user.documents).length === 0)) {
      return res.status(404).json({ message: 'No documents uploaded' })
    }

    return res.status(200).json({
      message: 'User documents fetched successfully',
      documents: user.documents
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Error fetching documents',
      error: error.message
    })
  }
}



export const getReferralCode = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).select('code name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Referral code fetched successfully',
      referralCode: user.code,
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error fetching referral code:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};



export const updateUserLocation = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;

    if (!userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'userId, latitude, and longitude are required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User location stored successfully',
      location: updatedUser.location,
    });
  } catch (error) {
    console.error('Error storing user location:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



export const getNearestBranch = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Find the user
    const user = await User.findById(userId);

    if (!user || !user.location || !Array.isArray(user.location.coordinates)) {
      return res.status(404).json({ message: 'User or location not found' });
    }

    const userCoords = user.location.coordinates; // [lng, lat]

    // ✅ Find nearest car with branch using $near WITHOUT maxDistance
    const nearestCar = await Car.findOne({
      status: 'active',
      runningStatus: 'Available',
      'branch.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userCoords,
          },
          $minDistance: 0,
          $maxDistance: 50000, // Optional: 50 km max range
        }
      }
    });

    if (!nearestCar) {
      return res.status(404).json({ message: 'No nearby branch found' });
    }

    return res.status(200).json({
      message: 'Nearest branch with available car found successfully',
      branch: nearestCar.branch,
      car: {
        _id: nearestCar._id,
        carName: nearestCar.carName,
        model: nearestCar.model,
        year: nearestCar.year,
        pricePerHour: nearestCar.pricePerHour,
        pricePerDay: nearestCar.pricePerDay,
        extendedPrice: nearestCar.extendedPrice,
        delayPerHour: nearestCar.delayPerHour,
        delayPerDay: nearestCar.delayPerDay,
        vehicleNumber: nearestCar.vehicleNumber,
        carImage: nearestCar.carImage,
        carType: nearestCar.carType,
        fuel: nearestCar.fuel,
        seats: nearestCar.seats,
        type: nearestCar.type,
        description: nearestCar.description,
        location: nearestCar.location,
      }
    });

  } catch (error) {
    console.error('Error finding nearest branch:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};




export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'varahi123@secure';
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // 🧾 Handle only payment_link.paid
    if (event.event === 'payment_link.paid') {
      const paymentLink = event.payload.payment_link.entity;
      const referenceId = paymentLink.reference_id;

      // ✅ Update the booking payment status
      await Booking.findByIdAndUpdate(referenceId, {
        paymentStatus: 'Paid'
      });

      console.log(`✅ Booking ${referenceId} marked as Paid`);
    }

    return res.status(200).json({ status: 'Webhook processed' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




// Setup Nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pms226803@gmail.com', // Your email address
    pass: 'nras bifq xsxz urrm', // Use your app password here
  },
  tls: {
    rejectUnauthorized: false, // Allow insecure connections (for debugging)
  },
  connectionTimeout: 10000, // Increase connection timeout to 10 seconds
  greetingTimeout: 10000,    // Increase greeting timeout to 10 seconds
  socketTimeout: 10000,      // Increase socket timeout to 10 seconds
});


export const deleteAccount = async (req, res) => {
  const { email, reason } = req.body; // Get email and reason from request body
  const { userId } = req.params; // Get userId from request params

  // Validate fields
  if (!email || !reason || !userId) {
    return res.status(400).json({ message: 'User ID, email, and reason are required' });
  }

  // Ensure userId is a valid ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    // Find user by userId (ensure userId is an ObjectId)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the provided email matches the user's email
    if (user.email !== email) {
      return res.status(400).json({ message: 'Email does not match the user account' });
    }

    // 2️⃣ Send email confirmation (without deleting the user)
    const mailOptions = {
      from: 'pms226803@gmail.com', // Your email address
      to: email, // Send to the email provided in the request
      subject: 'Account Deletion Request Received',
      text: `Hi ${user.name},\n\nWe have received your account deletion request. We're sorry to see you go! Your request has been processed, and your account is scheduled for deletion.\n\nReason for deletion: ${reason}\n\nIf you have any further queries, feel free to reach out to us.\n\nBest regards,\nYour Team`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: 'Account deletion request has been processed. A confirmation email has been sent to the user.',
    });
  } catch (err) {
    console.error('❌ Error in deleteAccount:', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};







