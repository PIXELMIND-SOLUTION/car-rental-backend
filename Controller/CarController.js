import Car from "../Models/Car.js";
// Add a new car
export const addCar = async (req, res) => {
  try {
    const {
      carName,
      model,
      year,
      pricePerHour,
      type,
      description,
      carImage = [],
      location,
      carType,
      fuel,
      seats,
      availability = [], // <-- array of objects { date, timeSlots }
    } = req.body;

    if (!Array.isArray(carImage)) {
      return res.status(400).json({ message: 'carImage should be an array of image URLs' });
    }

    // Optional: Validate availability structure
    for (const entry of availability) {
      if (!entry.date || !Array.isArray(entry.timeSlots)) {
        return res.status(400).json({ message: 'Invalid availability format. Each entry must have a date and an array of timeSlots.' });
      }
    }

    const newCar = new Car({
      carName,
      model,
      year,
      pricePerHour,
      description,
      carImage,
      location,
      carType,
      fuel,
      type,
      seats,
      availability, // ✅ added here
    });

    const savedCar = await newCar.save();
    return res.status(201).json({
      message: 'Car added successfully',
      car: savedCar,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error adding car', error: err.message });
  }
};

export const getAllCars = async (req, res) => {
  try {
    const { start, end, time, type, fuel, seats, location } = req.query;

    // Validate dates if provided
    const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    if ((start && !dateRegex.test(start)) || (end && !dateRegex.test(end))) {
      return res.status(400).json({ message: 'Date must be in YYYY/MM/DD format' });
    }

    // Build date range only if both dates are provided
    let dateRange = [];
    if (start && end) {
      const current = new Date(start.replace(/\//g, '-'));
      const endDate = new Date(end.replace(/\//g, '-'));

      while (current <= endDate) {
        const formatted = current.toISOString().slice(0, 10).replace(/-/g, '/');
        dateRange.push(formatted);
        current.setDate(current.getDate() + 1);
      }
    }

    // Handle time if provided
    let timeSlots = [];
    if (time) {
      timeSlots = time.split(',').map(t => t.trim());
      const timeRegex = /^\d{2}:\d{2}$/;
      for (const t of timeSlots) {
        if (!timeRegex.test(t)) {
          return res.status(400).json({ message: `Invalid time format: ${t}` });
        }
      }
    }

    // Build filter dynamically
    const filter = {};

    if (dateRange.length && timeSlots.length) {
      filter.availability = {
        $elemMatch: {
          date: { $in: dateRange },
          timeSlots: { $in: timeSlots },
        },
      };
    } else if (dateRange.length) {
      filter['availability.date'] = { $in: dateRange };
    }

    if (type) filter.type = type;
    if (fuel) filter.fuel = fuel;
    if (seats) filter.seats = parseInt(seats);
    if (location) filter.location = new RegExp(location, 'i'); // case-insensitive

    const cars = await Car.find(filter);

    if (!cars.length) {
      return res.status(404).json({ message: 'No cars found with the provided filters' });
    }

    return res.status(200).json({
      total: cars.length,
      cars,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching cars', error: err.message });
  }
};



// Get a car by ID
export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.status(200).json(car);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching car' });
  }
};

// Update a car by ID
export const updateCar = async (req, res) => {
  try {
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.status(200).json({ message: 'Car updated successfully', car: updatedCar });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating car' });
  }
};

// Delete a car by ID
export const deleteCar = async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);
    if (!deletedCar) {
      return res.status(404).json({ message: 'Car not found' });
    }
    return res.status(200).json({ message: 'Car deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting car' });
  }
};


export const createDeposit = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;
    const { deposit } = req.body;  // deposit as string

    if (!deposit || typeof deposit !== 'string' || deposit.trim() === '') {
      return res.status(400).json({ message: 'Please provide a valid deposit string' });
    }

    // Find booking matching user and bookingId
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for this user' });
    }

    // Update deposit as string
    booking.deposit = deposit.trim();

    await booking.save();

    return res.status(200).json({
      message: 'Deposit information updated successfully',
      deposit: booking.deposit,
      bookingId: booking._id,
    });
  } catch (error) {
    console.error('Error updating deposit:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
