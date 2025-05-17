import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import User from '../Models/User.js';
import Booking from '../Models/Booking.js';
import Car from '../Models/Car.js';
import cloudinary from '../config/cloudinary.js';


dotenv.config();




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


export const loginUser = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    // Find user by mobile number
    let user = await User.findOne({ mobile });

    // If user doesn't exist, create one
    if (!user) {
      user = new User({ mobile });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    // Respond with full user details including profileImage
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        mobile: user.mobile,
        code: user.code || null,
        profileImage: user.profileImage || null,  // Added here
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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



// User Controller (GET User)
export const getUser = async (req, res) => {
  try {
    const userId = req.params.userId;  // Get the user ID from request params

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found!' });
    }

    return res.status(200).json({
      message: 'User details retrieved successfully!', // Added message
      id: user._id,         // Include the user ID in the response
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profileImage: user.profileImage || 'default-profile-image.jpg', // Include profile image (or default if none)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const createProfile = async (req, res) => {
  try {
    const {userId} = req.params; // Get the userId from request params

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
    const {userId} = req.params; // Get the userId from request params

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



export const createBooking = async (req, res) => {
  try {
    const {
      userId,
      carId,
      rentalStartDate,
      rentalEndDate,
      from, // e.g. "4:00 AM"
      to    // e.g. "8:00 PM"
    } = req.body;

    // 1. Find car
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // 2. Convert AM/PM to 24-hour time
    const convertTo24Hour = (time) => {
      const [timePart, period] = time.trim().split(/\s+/);
      const [hours, minutes] = timePart.split(':');

      let hours24 = parseInt(hours, 10);
      if (period.toUpperCase() === 'PM' && hours24 !== 12) hours24 += 12;
      if (period.toUpperCase() === 'AM' && hours24 === 12) hours24 = 0;

      return `${hours24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    };

    const rentalStartTime = convertTo24Hour(from);
    const rentalEndTime = convertTo24Hour(to);

    // 3. Create full datetime strings
    const rentalStartDateTime = new Date(`${rentalStartDate}T${rentalStartTime}:00`);
    const rentalEndDateTime = new Date(`${rentalEndDate}T${rentalEndTime}:00`);

    // 4. Validate dates
    if (isNaN(rentalStartDateTime) || isNaN(rentalEndDateTime)) {
      return res.status(400).json({ message: 'Invalid date or time format' });
    }

    if (rentalStartDateTime >= rentalEndDateTime) {
      return res.status(400).json({
        message: 'Rental start date and time must be before the end date and time'
      });
    }

    // 5. Calculate duration and total price
    const durationInHours = Math.ceil(
      (rentalEndDateTime - rentalStartDateTime) / (1000 * 60 * 60)
    );
    const totalPrice = durationInHours * car.pricePerHour;

    // 6. Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // 7. Save booking
    const newBooking = new Booking({
      userId,
      carId,
      rentalStartDate: rentalStartDateTime,
      rentalEndDate: rentalEndDateTime,
      totalPrice,
      otp
    });

    const savedBooking = await newBooking.save();

    // 8. Link to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.myBookings.push(savedBooking._id);
    await user.save();

    // 9. Format dates (date-only)
    const formatDateOnly = (dateObj) =>
      dateObj.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });

    // 10. Response
    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: savedBooking._id,
        userId: savedBooking.userId,
        carId: savedBooking.carId,
        rentalStartDate: formatDateOnly(rentalStartDateTime), // ✅ date-only
        rentalEndDate: formatDateOnly(rentalEndDateTime),     // ✅ date-only
        from, // original input
        to,
        totalPrice,
        status: savedBooking.status,
        paymentStatus: savedBooking.paymentStatus,
        otp,
        pickupLocation: car.location || null,
        createdAt: savedBooking.createdAt,
        updatedAt: savedBooking.updatedAt
      },
      car: {
        _id: car._id,
        carName: car.carName,
        model: car.model,
        pricePerHour: car.pricePerHour,
        location: car.location,
        carImage: car.carImage
      }
    });

  } catch (err) {
    console.error('Error in createBooking:', err);
    return res.status(500).json({ message: 'Error creating booking' });
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
        status: booking.status,
        paymentStatus: booking.paymentStatus,
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
    const { newDeliveryDate, newDeliveryTime } = req.body;

    // Find booking and check ownership
    const booking = await Booking.findOne({ _id: bookingId, userId }).populate('carId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found or does not belong to this user' });
    }

    // Parse new delivery datetime
    const newDeliveryDateTime = new Date(`${newDeliveryDate}T${newDeliveryTime}:00Z`);
    const oldEndTime = new Date(booking.rentalEndDate);

    if (newDeliveryDateTime <= oldEndTime) {
      return res.status(400).json({ message: 'New delivery time must be after the current rental end time' });
    }

    const extraHours = Math.ceil((newDeliveryDateTime - oldEndTime) / (1000 * 60 * 60));
    const pricePerHour = booking.carId.pricePerHour;
    booking.totalPrice += extraHours * pricePerHour;

    booking.rentalEndDate = newDeliveryDateTime;
    booking.deliveryDate = newDeliveryDate;
    booking.deliveryTime = newDeliveryTime;

    const updatedBooking = await booking.save();

    return res.status(200).json({
      message: 'Booking extended successfully',
      updatedBooking: {
        _id: updatedBooking._id,
        rentalEndDate: updatedBooking.rentalEndDate.toLocaleString('en-US'),
        deliveryDate: updatedBooking.deliveryDate,
        deliveryTime: updatedBooking.deliveryTime,
        totalPrice: updatedBooking.totalPrice
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
    const userId = req.params.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const uploadedDocs = {}

    // Upload Aadhar Card
    if (req.files?.aadharCard) {
      const result = await cloudinary.uploader.upload(
        req.files.aadharCard.tempFilePath,
        { folder: 'user_documents/aadhar' }
      )

      uploadedDocs.aadharCard = {
        url: result.secure_url,
        uploadedAt: new Date(),
        status: 'pending'
      }
    }

    // Upload Driving License
    if (req.files?.drivingLicense) {
      const result = await cloudinary.uploader.upload(
        req.files.drivingLicense.tempFilePath,
        { folder: 'user_documents/license' }
      )

      uploadedDocs.drivingLicense = {
        url: result.secure_url,
        uploadedAt: new Date(),
        status: 'pending'
      }
    }

    // Push to existing user.documents
    user.documents = {
      ...user.documents,
      ...uploadedDocs
    }

    await user.save()

    return res.status(200).json({
      message: 'Documents uploaded successfully',
      documents: user.documents
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Error uploading documents',
      error: error.message
    })
  }
}



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








