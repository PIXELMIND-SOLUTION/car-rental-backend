import VisitorModel from '../Models/VisitorModel.js';

// Add a new visitor
export const addVisitor = async (req, res) => {
  try {
    const { purpose, name, phone, email, noOfPersons, date, inTime, outTime } = req.body;
    const file = req.file ? req.file.path : null;

    // Validate required fields
    if (!purpose || !name || !email || !noOfPersons || !date || !inTime || !outTime) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    // Create a new visitor entry
    const visitor = new VisitorModel({
      purpose,
      name,
      phone,
      email,
      noOfPersons,
      date,
      inTime,
      outTime,
      file,
    });

    await visitor.save();

    res.status(201).json({ message: 'Visitor added successfully!', visitor });
  } catch (error) {
    res.status(500).json({ message: 'Error adding visitor.', error: error.message });
  }
};

// Get visitors
export const getVisitors = async (req, res) => {
  try {
    const { date } = req.query;

    // Filter by date if provided
    const filter = date ? { date: new Date(date) } : {};

    const visitors = await VisitorModel.find(filter);

    res.status(200).json({ message: 'Visitors fetched successfully!', visitors });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching visitors.', error: error.message });
  }
};
