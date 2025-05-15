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
      carImage = [], // ✅ default to empty array if not provided
      location,
      carType,
      fuel,
      seats,
    } = req.body;

    // Optional: Validate that carImage is an array of strings
    if (!Array.isArray(carImage)) {
      return res.status(400).json({ message: 'carImage should be an array of image URLs' });
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

// Get all cars with optional filters
export const getAllCars = async (req, res) => {
  try {
    const { type, fuel, seats, location } = req.query;

    // Dynamically build filter object
    const filter = {};

    if (type) filter.type = type;
    if (fuel) filter.fuel = fuel;
    if (seats) filter.seats = parseInt(seats);
    if (location) filter.location = new RegExp(location, 'i'); // case-insensitive match

    const cars = await Car.find(filter);

    if (!cars.length) {
      return res.status(404).json({ message: 'No cars found with the provided filters' });
    }

    return res.status(200).json({ total: cars.length, cars });
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
