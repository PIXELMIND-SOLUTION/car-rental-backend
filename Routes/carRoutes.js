import express from 'express';
import { addCar, getAllCars, getCarById, updateCar, deleteCar } from '../Controller/CarController.js'

const router = express.Router();

// Route to add a new car
router.post('/add-cars', addCar);

// Route to get all cars
router.get('/get-cars', getAllCars);

// Route to get a single car by ID
router.get('/getcar/:carId', getCarById);

// Route to update a car by ID
router.put('/cars/:id', updateCar);

// Route to delete a car by ID
router.delete('/cars/:id', deleteCar);

export default router;
