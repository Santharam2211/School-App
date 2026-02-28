const Teacher = require('../models/Teacher');
const Assignment = require('../models/ClassMapping');

const validateTeacherAssignment = async (req, res, next) => {
  try {
    const { teacherId, subject, classNo, isClassTeacherAssignment } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    if (isClassTeacherAssignment) {
      const existingClassTeacher = await Assignment.findOne({ 
        classTeacher: teacherId 
      });
      
      if (existingClassTeacher && existingClassTeacher.stuClass !== classNo) {
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
    }

    if (subject && !teacher.subjects.includes(subject)) {
      return res.status(400).json({ 
        error: `Teacher is not assigned to teach subject: ${subject}` 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { validateTeacherAssignment };
