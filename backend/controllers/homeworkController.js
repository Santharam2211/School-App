const Homework = require('../models/Homework');
const { getSocket } = require('../socket');
const { sendHomeworkSMS, sendSMSToStudent } = require('../services/smsService');

// GET all homework for a class
exports.getHomeworkByClass = async (req, res) => {
  const classNo = req.params.class;
  const homework = await Homework.find({ class: classNo }).sort({ date: -1 });
  res.json(homework);
};

// POST new or updated homework
exports.addOrUpdateHomework = async (req, res) => {
  try {
    const { class: classNo, hour, subject, text } = req.body;

    const existing = await Homework.findOne({ class: classNo, hour, subject, date: { $gte: new Date().setHours(0,0,0,0) } });

    let homework;
    let isNewHomework = false;
    
    if (existing) {
      existing.text = text;
      homework = await existing.save();
    } else {
      homework = await Homework.create(req.body);
      isNewHomework = true;
    }

    // Send SMS notification for new homework
    if (isNewHomework && text && text.trim()) {
      try {
        const smsResult = await sendHomeworkSMS({
          homeworkText: text,
          day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          teacherId: req.body.teacherId || 'Unknown'
        }, classNo);
        
        console.log('SMS notification result:', smsResult);
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
        // Don't fail the homework creation if SMS fails
      }
    }

    const io = getSocket();
    io.emit('homeworkUpdated', homework);

    res.json({
      ...homework.toObject(),
      smsSent: isNewHomework
    });
  } catch (error) {
    console.error('Error in addOrUpdateHomework:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save homework',
      error: error.message 
    });
  }
};

// Send SMS to specific student
exports.sendSMSToStudent = async (req, res) => {
  try {
    const { studentId, message } = req.body;
    
    if (!studentId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and message are required' 
      });
    }
    
    const result = await sendSMSToStudent(studentId, message);
    res.json(result);
  } catch (error) {
    console.error('Error sending SMS to student:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send SMS',
      error: error.message 
    });
  }
};

// Send SMS to all students in a class
exports.sendSMSToClass = async (req, res) => {
  try {
    const { classId, message } = req.body;
    
    if (!classId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Class ID and message are required' 
      });
    }
    
    const result = await sendHomeworkSMS({
      homeworkText: message,
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      teacherId: 'Manual'
    }, classId);
    
    res.json(result);
  } catch (error) {
    console.error('Error sending SMS to class:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send SMS to class',
      error: error.message 
    });
  }
};
