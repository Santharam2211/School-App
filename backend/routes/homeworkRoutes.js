const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Homework = require('../models/Homework');
const User = require('../models/User');
const homeworkController = require('../controllers/homeworkController');
const { uploadHomeworkPDF, handleUploadError } = require('../middleware/uploadMiddleware');

function safeUnlinkHomeworkPdf(filename) {
  try {
    if (!filename) return;
    const filePath = path.join(__dirname, '../uploads/homework-pdfs', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn('Failed to delete homework PDF:', e.message);
  }
}

// GET homework by class with student submission status
router.get('/class/:classNo', async (req, res) => {
  try {
    const { classNo } = req.params;
    const { studentId } = req.query; // Optional: to get status for specific student
    
    // Find homework for the specific class
    const homework = await Homework.find({ classId: Number(classNo) })
      .populate('teacherId', 'username')
      .sort({ createdAt: -1 })
      .lean();

    // Format the response
    const formattedHomework = homework.map(hw => {
      let status = 'Pending';
      if (studentId && hw.submissions) {
        const submission = hw.submissions.find(s => s.studentId.toString() === studentId);
        status = submission?.status === 'finished' ? 'Finished' : 'Pending';
      }
      
      return {
        _id: hw._id,
        title: `Homework - ${hw.day}`,
        subject: hw.subject || 'General',
        description: hw.homeworkText,
        teacherName: hw.teacherId?.username || 'Teacher',
        dueDate: hw.createdAt,
        status: status,
        classId: hw.classId,
        day: hw.day,
        pdfAttachment: hw.pdfAttachment,
        pdfOriginalName: hw.pdfOriginalName
      };
    });

    res.json(formattedHomework);
  } catch (error) {
    console.error('Error fetching homework by class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new homework with PDF attachment support
router.post('/', uploadHomeworkPDF, handleUploadError, async (req, res) => {
  try {
    const { classId, day, homeworkText, teacherId, subject, hour, slotId } = req.body;
    
    console.log('📝 Creating homework:', { classId, day, homeworkText: homeworkText?.substring(0, 50), teacherId, subject, hour, slotId });
    
    const homeworkData = {
      classId: Number(classId),
      day: day.toLowerCase(),
      homeworkText,
      teacherId,
      subject: subject || 'General',
      hour: hour || '',
      slotId: slotId || null
    };

    // Add PDF attachment info if file was uploaded
    if (req.file) {
      homeworkData.pdfAttachment = req.file.filename;
      homeworkData.pdfOriginalName = req.file.originalname;
      console.log('📎 PDF attachment added:', req.file.originalname);
    }

    // Upsert so re-posting for same class/day/slot updates instead of creating duplicates
    const query = {
      classId: Number(homeworkData.classId),
      day: homeworkData.day,
      slotId: homeworkData.slotId,
      teacherId: homeworkData.teacherId
    };

    const existing = await Homework.findOne(query);

    let homework;
    let isNewHomework = false;

    if (existing) {
      // Replace PDF if a new one is uploaded
      if (req.file && existing.pdfAttachment) {
        safeUnlinkHomeworkPdf(existing.pdfAttachment);
      }

      existing.classId = homeworkData.classId;
      existing.day = homeworkData.day;
      existing.homeworkText = homeworkData.homeworkText;
      existing.teacherId = homeworkData.teacherId;
      existing.subject = homeworkData.subject;
      existing.hour = homeworkData.hour;
      existing.slotId = homeworkData.slotId;

      if (req.file) {
        existing.pdfAttachment = homeworkData.pdfAttachment;
        existing.pdfOriginalName = homeworkData.pdfOriginalName;
      }

      homework = await existing.save();
    } else {
      homework = new Homework(homeworkData);
      await homework.save();
      isNewHomework = true;
    }
    
    console.log('✅ Homework saved successfully, sending SMS...');
    
    // Send SMS notification only for new homework
    if (isNewHomework && homeworkText && homeworkText.trim()) {
      try {
        const { sendHomeworkSMS } = require('../services/smsService');
        const smsResult = await sendHomeworkSMS({
          homeworkText,
          day: day,
          teacherId: teacherId || 'Unknown'
        }, Number(classId));
        
        console.log('SMS notification result:', smsResult);
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
        // Don't fail the homework creation if SMS fails
      }
    }
    
    // Populate teacher info
    const populatedHomework = await Homework.findById(homework._id)
      .populate('teacherId', 'username')
      .lean();

    res.status(201).json({
      _id: populatedHomework._id,
      title: `Homework - ${populatedHomework.day}`,
      subject: populatedHomework.subject || 'General',
      description: populatedHomework.homeworkText,
      teacherName: populatedHomework.teacherId?.username || 'Teacher',
      dueDate: populatedHomework.createdAt,
      status: 'Pending',
      classId: populatedHomework.classId,
      day: populatedHomework.day,
      smsSent: isNewHomework,
      pdfAttachment: populatedHomework.pdfAttachment,
      pdfOriginalName: populatedHomework.pdfOriginalName
    });
  } catch (error) {
    console.error('Error creating homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update homework (with optional PDF replace/remove)
router.put('/:homeworkId', uploadHomeworkPDF, handleUploadError, async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { classId, day, homeworkText, teacherId, subject, hour, slotId, removePdf } = req.body;

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    if (classId !== undefined) homework.classId = Number(classId);
    if (day !== undefined) homework.day = String(day).toLowerCase();
    if (homeworkText !== undefined) homework.homeworkText = homeworkText;
    if (teacherId !== undefined) homework.teacherId = teacherId;
    if (subject !== undefined) homework.subject = subject;
    if (hour !== undefined) homework.hour = hour;
    if (slotId !== undefined) homework.slotId = slotId;

    const shouldRemovePdf = String(removePdf).toLowerCase() === 'true';

    // Remove existing PDF if requested
    if (shouldRemovePdf && homework.pdfAttachment) {
      safeUnlinkHomeworkPdf(homework.pdfAttachment);
      homework.pdfAttachment = null;
      homework.pdfOriginalName = null;
    }

    // Replace existing PDF if a new one is uploaded
    if (req.file) {
      if (homework.pdfAttachment) {
        safeUnlinkHomeworkPdf(homework.pdfAttachment);
      }
      homework.pdfAttachment = req.file.filename;
      homework.pdfOriginalName = req.file.originalname;
    }

    await homework.save();

    const populatedHomework = await Homework.findById(homework._id)
      .populate('teacherId', 'username')
      .lean();

    res.json({
      _id: populatedHomework._id,
      title: `Homework - ${populatedHomework.day}`,
      subject: populatedHomework.subject || 'General',
      description: populatedHomework.homeworkText,
      teacherName: populatedHomework.teacherId?.username || 'Teacher',
      dueDate: populatedHomework.createdAt,
      status: 'Pending',
      classId: populatedHomework.classId,
      day: populatedHomework.day,
      pdfAttachment: populatedHomework.pdfAttachment,
      pdfOriginalName: populatedHomework.pdfOriginalName
    });
  } catch (error) {
    console.error('Error updating homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE homework (also deletes stored PDF if any)
router.delete('/:homeworkId', async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    if (homework.pdfAttachment) {
      safeUnlinkHomeworkPdf(homework.pdfAttachment);
    }

    await Homework.deleteOne({ _id: homeworkId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark homework as finished by student
router.post('/:homeworkId/submit', async (req, res) => {
  try {
    const { homeworkId } = req.params;
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }
    
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    
    // Check if student already has a submission
    const existingSubmission = homework.submissions.find(
      s => s.studentId.toString() === studentId
    );
    
    if (existingSubmission) {
      existingSubmission.status = 'finished';
      existingSubmission.completedAt = new Date();
    } else {
      homework.submissions.push({
        studentId,
        status: 'finished',
        completedAt: new Date()
      });
    }
    
    await homework.save();
    res.json({ success: true, message: 'Homework marked as finished' });
  } catch (error) {
    console.error('Error submitting homework:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get homework submission details (for teachers)
router.get('/:homeworkId/submissions', async (req, res) => {
  try {
    const { homeworkId } = req.params;
    
    const homework = await Homework.findById(homeworkId)
      .populate('submissions.studentId', 'username')
      .populate('teacherId', 'username')
      .lean();
    
    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }
    
    // Get all students in the class
    const Student = require('../models/Student');
    const students = await Student.find({ stuClass: homework.classId }).lean();
    
    // Map submissions to include all students
    const submissionDetails = students.map(student => {
      const submission = homework.submissions?.find(
        s => s.studentId?.username === student.name || s.studentId?._id.toString() === student._id?.toString()
      );
      
      return {
        studentName: student.name,
        rollNo: student.rollNo,
        status: submission?.status || 'pending',
        completedAt: submission?.completedAt || null
      };
    });
    
    res.json({
      homework: {
        _id: homework._id,
        subject: homework.subject,
        description: homework.homeworkText,
        teacherName: homework.teacherId?.username,
        day: homework.day,
        classId: homework.classId,
        pdfAttachment: homework.pdfAttachment,
        pdfOriginalName: homework.pdfOriginalName
      },
      submissions: submissionDetails,
      totalStudents: students.length,
      finishedCount: submissionDetails.filter(s => s.status === 'finished').length
    });
  } catch (error) {
    console.error('Error fetching homework submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SMS endpoints
router.post('/sms/student', homeworkController.sendSMSToStudent);
router.post('/sms/class', homeworkController.sendSMSToClass);

module.exports = router;

