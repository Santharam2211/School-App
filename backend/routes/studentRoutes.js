const express = require('express');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Leave = require('../models/Leave');
const router = express.Router();

// Helper: derive alphabetic username from student name
function deriveUsername(name, rollNo) {
  const nameBased = (name || '').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return nameBased || String(rollNo || '').trim().toLowerCase();
}

// 👉 Add new student
router.post('/', async (req, res) => {
  console.log('Creating student:', req.body);
  try {
    const rollNo = (req.body.rollNo || '').trim();
    const password = (req.body.password || '').trim();

    if (!rollNo || !password) {
      return res.status(400).json({ message: 'Roll number and password are required' });
    }

    // Username is derived from student's name (alphabetic) — e.g. 'John Doe' -> 'johndoe'
    // This allows login with letters instead of just the numeric rollNo
    const username = deriveUsername(req.body.name, rollNo);

    // Create User first with name-based username and password
    const newUser = await User.create({
      _id: new mongoose.Types.ObjectId(),
      username,
      password,
      role: "student"
    });
    console.log('User created with username:', newUser.username, '(from name:', req.body.name, ')');

    // Create Student with same ID
    const student = new Student({
      name: req.body.name,
      rollNo,
      stuClass: req.body.stuClass,
      mobile: req.body.mobile,
      _id: newUser._id
    });
    await student.save();
    console.log('Student created:', student._id.toString());

    res.status(201).json(student);
  } catch (err) {
    console.error('Error creating student:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Roll number already exists' });
    }
    res.status(500).json({ message: 'Error adding student', error: err.message });
  }
});

// 👉 Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ rollNo: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 👉 Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👉 Update student
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const update = {
      name: req.body.name,
      rollNo: (req.body.rollNo || '').trim(),
      stuClass: req.body.stuClass,
      mobile: req.body.mobile
    };

    const s = await Student.findByIdAndUpdate(id, update, { new: true });
    if (!s) return res.status(404).json({ message: 'Student not found' });

    // Update linked User: username is derived from the (updated) name
    // so login remains alphabetic even after updates
    const userUpdate = {};
    if (req.body.name) {
      userUpdate.username = deriveUsername(req.body.name, req.body.rollNo);
    }
    const password = typeof req.body.password === 'string' ? req.body.password.trim() : undefined;
    if (password && password.length) userUpdate.password = password;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(id, userUpdate);
    }

    res.json(s);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// 👉 Delete student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the Student record
    const deletedStudent = await Student.findByIdAndDelete(id);
    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Also delete the associated User record
    await User.findByIdAndDelete(id);

    // Delete all leave records associated with this student
    await Leave.deleteMany({ student: id });

    res.json({ message: 'Student, associated user account, and leave records deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

module.exports = router;
