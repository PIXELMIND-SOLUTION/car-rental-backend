import Car from "../Models/Car.js";
// Add a new car
export const addCar = async (req, res) => {
  try {
    const { carName, model, year, pricePerHour, type, description, carImage, location, carType, fuel, seats } = req.body;

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
    return res.status(201).json({ message: 'Car added successfully', car: savedCar });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error adding car' });
  }
};

// Get all cars with optional filters
export const getAllCars = async (req, res) => {
  try {
    const { carType, fuel } = req.query;

    // Build the filter object based on query parameters
    let filter = {};

    if (carType) {
      filter.carType = carType;  // Apply filter if carType is provided
    }

    if (fuel) {
      filter.fuel = fuel;  // Apply filter if fuel type is provided
    }

    // Fetch cars based on the filter, or all cars if no filter is applied
    const cars = await Car.find(filter);

    // If no cars are found, return a message indicating no results
    if (cars.length === 0) {
      return res.status(404).json({ message: 'No cars found with this filter' });
    }

    return res.status(200).json(cars);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching cars' });
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
