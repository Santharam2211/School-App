const Leave = require('../models/Leave');
const Student = require('../models/Student');
const Assignment = require('../models/ClassMapping');
const { getSocket } = require('../socket');

exports.applyLeave = async (req, res) => {
  try {
    const { student, from, to, reason } = req.body;
    
    // Get student's class
    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get class teacher for the student's class
    const classMapping = await Assignment.findOne({ stuClass: studentDoc.stuClass });
    let classTeacher = null;
    
    if (classMapping) {
      // Use the specifically assigned class teacher
      classTeacher = classMapping.classTeacher;
      
      // If no class teacher is assigned, fall back to first teacher from subjects
      if (!classTeacher && classMapping.subjects) {
        const teacherIds = Object.values(classMapping.subjects);
        if (teacherIds.length > 0) {
          classTeacher = teacherIds[0];
        }
      }
    }
    
    if (!classTeacher) {
      return res.status(400).json({ message: 'No class teacher assigned for this student\'s class' });
    }
    
    const leave = await Leave.create({
      student,
      classTeacher,
      from,
      to,
      reason
    });
    
    // Populate the leave with student and classTeacher data
    const populatedLeave = await Leave.findById(leave._id)
      .populate('student')
      .populate('classTeacher');
    
    try { getSocket().emit('leaveApplied', populatedLeave); } catch {}
    res.json(populatedLeave);
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ message: 'Error applying leave' });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const q = {};
    
    // If student query parameter is provided, only show leaves for that student
    if (req.query.student) {
      q.student = req.query.student;
    }
    
    // If teacher query parameter is provided, only show leaves for that teacher's class
    if (req.query.teacher) {
      q.classTeacher = req.query.teacher;
    }
    
    const leaves = await Leave.find(q)
      .sort({ _id: -1 })
      .populate('student')
      .populate('classTeacher');
    
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Error fetching leaves' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    ).populate('student').populate('classTeacher');
    
    if (!leave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    
    try { getSocket().emit('leaveStatusUpdated', leave); } catch {}
    res.json(leave);
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ message: 'Error updating leave status' });
  }
};
