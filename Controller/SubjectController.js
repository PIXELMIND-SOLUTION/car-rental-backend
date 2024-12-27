import asyncHandler from 'express-async-handler';
import Subject from '../Models/Subject.js';

const getSubjects = asyncHandler(async (req, res) => {
    const subjects = await Subject.find();
    res.json(subjects);
});

const createSubject = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const subject = new Subject({ name });
    const createdSubject = await subject.save();
    res.status(201).json(createdSubject);
});

const deleteSubject = asyncHandler(async (req, res) => {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
    }
    await subject.remove();
    res.json({ message: 'Subject removed' });
});

export { getSubjects, createSubject, deleteSubject };
