const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Assignment = require('../models/ClassMapping');
const { validateTeacherAssignment } = require('../middleware/teacherValidation');

exports.addStudent = async (req, res) => {
  const student = await Student.create(req.body);
  res.json(student);
};

exports.updateStudent = async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(student);
};

exports.deleteStudent = async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};

exports.assignTeacherToClass = async (req, res) => {
  try {
    const { classNo, subject, teacherId } = req.body;
    
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (!teacher.subjects.includes(subject)) {
      return res.status(400).json({ 
        error: `Teacher is not assigned to teach subject: ${subject}` 
      });
    }

    let assignment = await Assignment.findOne({ stuClass: classNo });
    
    if (!assignment) {
      assignment = await Assignment.create({
        stuClass: classNo,
        subjects: new Map([[subject, teacherId]]),
        classTeacher: null
      });
    } else {
      assignment.subjects.set(subject, teacherId);
      await assignment.save();
    }
    
    res.json(await Assignment.findById(assignment._id).populate('subjects.$*'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.assignClassTeacher = async (req, res) => {
  try {
    const { classNo, teacherId } = req.body;
    
    const existingAssignment = await Assignment.findOne({ 
      classTeacher: teacherId 
    });
    
    if (existingAssignment && existingAssignment.stuClass !== classNo) {
      return res.status(400).json({ 
        error: 'Teacher is already assigned as class teacher to another class' 
      });
    }

    const currentClassTeacher = await Assignment.findOne({ 
      stuClass: classNo,
      classTeacher: { $ne: null }
    });
    
    if (currentClassTeacher) {
      return res.status(400).json({ 
        error: 'Class already has a class teacher assigned' 
      });
    }

    await Teacher.findByIdAndUpdate(teacherId, { 
      isClassTeacher: true, 
      assignedClass: classNo 
    });

    let assignment = await Assignment.findOne({ stuClass: classNo });
    if (!assignment) {
      assignment = await Assignment.create({
        stuClass: classNo,
        subjects: new Map(),
        classTeacher: teacherId
      });
    } else {
      assignment.classTeacher = teacherId;
      await assignment.save();
    }
    
    res.json(await Assignment.findById(assignment._id).populate('classTeacher'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  const assignments = await Assignment.find().populate('teacher');
  res.json(assignments);
};
