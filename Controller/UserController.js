import jwt from 'jsonwebtoken'; // For JWT token generation
import dotenv from 'dotenv';
import User from '../Models/User.js';
import multer from 'multer'; // Import multer for file handling
import path from 'path';  // To resolve file paths
import Booking from '../Models/Booking.js';
import Car from '../Models/Car.js';
import cloudinary from '../config/cloudinary.js';




// Set up storage for profile images using Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles'); // Specify folder to store uploaded files
  },
  filename: function (req, file, cb) {
    // Set the filename for the uploaded file
    cb(null, Date.now() + '-' + file.originalname); // Add timestamp to avoid conflicts
  },
});

// Filter to ensure only image files can be uploaded
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'));
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: fileFilter,
});


export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, code } = req.body;

    // Check if user already exists
    const userExist = await User.findOne({ $or: [{ email }, { mobile }] });
    if (userExist) {
      return res.status(400).json({ message: 'User with this email or mobile already exists!' });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      mobile,
      code: code || null,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    // ✅ Send full user details in response
    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        code: newUser.code,
        wallet: newUser.wallet || [],
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

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

    // Respond with full user details like registration
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        mobile: user.mobile,
        code: user.code || null,
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



// User Controller (UPDATE User)
export const updateUser = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const userId = req.params.id;  // Get the user ID from request params
      const { name, email, mobile } = req.body;

      // Find the user by ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found!' });
      }

      // Check if the email or mobile is already taken by another user
      const userExist = await User.findOne({
        $or: [{ email }, { mobile }],
      });

      if (userExist && userExist._id.toString() !== userId) {
        return res.status(400).json({
          message: 'Email or mobile is already associated with another user.',
        });
      }

      // Update user details
      user.name = name || user.name;
      user.email = email || user.email;
      user.mobile = mobile || user.mobile;

      // Check if a new profile image is uploaded
      if (req.file) {
        // Update the profile image
        user.profileImage = `/uploads/profiles/${req.file.filename}`;
      }

      // Save the updated user to the database
      await user.save();

      return res.status(200).json({
        message: 'User updated successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          profileImage: user.profileImage,  // Return the updated profile image
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];





export const createProfile = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const userId = req.params.id; // Get userId from params

      // Check if the user already exists by userId
      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found!' });
      }

      // If a profile image is uploaded, update the profileImage field
      const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : existingUser.profileImage;

      // Update the user's profile image
      existingUser.profileImage = profileImage;

      // Save the updated user to the database
      await existingUser.save();

      return res.status(200).json({
        message: 'Profile image updated successfully!',
        user: {
          id: existingUser._id,
          profileImage: existingUser.profileImage,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];

// Update Profile Image (with userId in params)
export const editProfile = [
  upload.single('profileImage'),  // 'profileImage' is the field name in the Form Data
  async (req, res) => {
    try {
      const userId = req.params.userId; // Get userId from params

      // Check if the user exists by userId
      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ message: 'User not found!' });
      }

      // If a profile image is uploaded, update the profileImage field
      const profileImage = req.file ? `/uploads/profiles/${req.file.filename}` : existingUser.profileImage;

      // Update the user's profile image
      existingUser.profileImage = profileImage;

      // Save the updated user to the database
      await existingUser.save();

      return res.status(200).json({
        message: 'Profile image updated successfully!',
        user: {
          id: existingUser._id,
          profileImage: existingUser.profileImage,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
    }
  },
];


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
      from,
      to
    } = req.body;

    // 1. Find the car
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    // 2. Create full datetime values
    const rentalStartDateTime = new Date(`${rentalStartDate}T${from}:00Z`);
    const rentalEndDateTime = new Date(`${rentalEndDate}T${to}:00Z`);

    // 3. Validate rental period
    if (rentalStartDateTime >= rentalEndDateTime) {
      return res.status(400).json({
        message: 'Rental start date and time must be before the end date and time'
      });
    }

    // 4. Calculate rental duration and price
    const durationInHours = Math.ceil(
      (rentalEndDateTime - rentalStartDateTime) / (1000 * 60 * 60)
    );
    const totalPrice = durationInHours * car.pricePerHour;

    // 5. Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // 6. Create booking document
    const newBooking = new Booking({
      userId,
      carId,
      rentalStartDate: rentalStartDateTime,
      rentalEndDate: rentalEndDateTime,
      totalPrice,
      otp
    });

    const savedBooking = await newBooking.save();

    // 7. Link booking to user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.myBookings.push(savedBooking._id);
    await user.save();

    // 8. Format readable dates
    const readableStartDate = rentalStartDateTime.toLocaleString('en-US');
    const readableEndDate = rentalEndDateTime.toLocaleString('en-US');

    // 9. Respond with booking and car details including 'from' and 'to'
    return res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: savedBooking._id,
        userId: savedBooking.userId,
        carId: savedBooking.carId,
        rentalStartDate: readableStartDate,
        rentalEndDate: readableEndDate,
        from, // show original input time
        to,   // show original input time
        totalPrice: savedBooking.totalPrice,
        status: savedBooking.status,
        paymentStatus: savedBooking.paymentStatus,
        otp: savedBooking.otp,
        pickupLocation: car.location || null,
        createdAt: savedBooking.createdAt,
        updatedAt: savedBooking.updatedAt
      },
      car: {
        _id: car._id,
        carName: car.carName,
        brand: car.brand,
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

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get last known balance
    const lastTransaction = user.wallet[user.wallet.length - 1];
    let currentTotal = lastTransaction?.totalWalletAmount || 0;

    // Add this transaction amount to running total
    currentTotal += Number(amount);

    const newTransaction = {
      amount: Number(amount),
      type: 'credit',
      message: 'Paid To Wallet',
      totalWalletAmount: currentTotal
    };

    user.wallet.push(newTransaction);
    await user.save();

    res.json({
      message: 'Amount added to wallet',
      transaction: newTransaction,
      wallet: user.wallet
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getWalletTransactions = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ wallet: user.wallet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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







