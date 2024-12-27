import asyncHandler from 'express-async-handler';
import Class from '../models/Class.js';

const getClasses = asyncHandler(async (req, res) => {
    const classes = await Class.find();
    res.json(classes);
});

const createClass = asyncHandler(async (req, res) => {
    const { name, teacherId } = req.body;
    const newClass = new Class({ name, teacherId });
    const createdClass = await newClass.save();
    res.status(201).json(createdClass);
});

const updateClass = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
        res.status(404);
        throw new Error('Class not found');
    }
    Object.assign(classObj, req.body);
    const updatedClass = await classObj.save();
    res.json(updatedClass);
});

const deleteClass = asyncHandler(async (req, res) => {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
        res.status(404);
        throw new Error('Class not found');
    }
    await classObj.remove();
    res.json({ message: 'Class removed' });
});

export { getClasses, createClass, updateClass, deleteClass };
