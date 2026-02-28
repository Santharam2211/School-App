const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// Create a leave (applied by class teacher on behalf of student)
router.post('/', leaveController.applyLeave);

// List all leaves (optionally filtered by class via query ?class=1)
router.get('/', leaveController.getAllLeaves);

// Update status (approve/reject)
router.patch('/:id', leaveController.updateLeaveStatus);

module.exports = router;


