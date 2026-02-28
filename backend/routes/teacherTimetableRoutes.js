const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TimeTable = require("../models/Timetable");
const Homework = require("../models/Homework");
const { sendHomeworkSMS } = require("../services/smsService"); // ✅ Import SMS service

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * GET /api/teacher-timetable/:teacherId/:day
 * Fetch timetable slots for a teacher on a specific day
 */
router.get("/:teacherId/:day", async (req, res) => {
  try {
    const { teacherId, day } = req.params;
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
    const targetDay = day.toLowerCase();

    // 1️⃣ Fetch teacher's classes and slots for the target day
    const teacherTimetable = await TimeTable.aggregate([
      { $project: { classId: 1, timetable: { $objectToArray: "$timetable" } } },
      { $unwind: "$timetable" },
      { $match: { "timetable.k": targetDay } },
      { $unwind: "$timetable.v" },
      { $match: { "timetable.v.teacher": teacherObjectId } },
      {
        $project: {
          classId: 1,
          day: "$timetable.k",
          hour: "$timetable.v.hour",
          subject: "$timetable.v.subject",
          homework: "$timetable.v.homework",
          slotId: "$timetable.v._id" // unique ID for each slot
        }
      },
      { $sort: { hour: 1 } }
    ]);

    // 2️⃣ Fetch homework entries for the day
    const homeworkList = await Homework.find({
      teacherId: teacherObjectId,
      day: targetDay
    });

    const hwMap = {};
    homeworkList.forEach(hw => {
      hwMap[hw.slotId.toString()] = {
        homeworkText: hw.homeworkText,
        homeworkId: hw._id
      };
    });

    // 3️⃣ Merge homework into timetable
    const merged = teacherTimetable.map(slot => ({
      ...slot,
      homework: hwMap[slot.slotId.toString()]?.homeworkText || "",
      homeworkId: hwMap[slot.slotId.toString()]?.homeworkId || null
    }));

    res.json(merged);
  } catch (err) {
    console.error("Error fetching teacher timetable:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/teacher-homework/update
 * Update homework for a specific slot + Send SMS to all students
 */
router.post("/update", async (req, res) => {
  try {
    const { classId, day, slotId, homeworkText, teacherId } = req.body;

    // ✅ Validation
    if (!classId || !day || !slotId || !homeworkText || !teacherId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const slotObjectId = new mongoose.Types.ObjectId(slotId);
    const teacherObjectId = new mongoose.Types.ObjectId(teacherId);

    // ✅ Upsert (create/update) homework entry
    const hw = await Homework.findOneAndUpdate(
      { classId, day, slotId: slotObjectId, teacherId: teacherObjectId },
      { homeworkText },
      { upsert: true, new: true, useFindAndModify: false }
    );

    // Send SMS to all students in this class
    let smsStatus = null;
    try {
      const smsResult = await sendHomeworkSMS(
        {
          homeworkText,
          day,
          teacherId
        },
        classId
      );

      console.log(`SMS sent to ${smsResult.sentCount || 0} students in class ${classId}`);
      
      if (smsResult.failedCount > 0) {
        console.log(`${smsResult.failedCount} SMS failed to send`);
        console.log('Check the logs above for detailed error information');
      }
      
      smsStatus = {
        success: true,
        sent: smsResult.sentCount || 0,
        failed: smsResult.failedCount || 0,
        skipped: smsResult.skippedCount || 0,
        details: smsResult.results
      };
    } catch (smsError) {
      console.error("Error sending SMS to class:", smsError.message);
      smsStatus = {
        success: false,
        error: smsError.message
      };
      // Continue — don't fail the homework save if SMS fails
    }

    res.json({
      success: true,
      message: "Homework saved and SMS sent successfully",
      homework: hw,
      smsStatus
    });
  } catch (err) {
    console.error("Error updating homework:", err);
    res.status(500).json({ error: "Failed to save homework" });
  }
});

module.exports = router;
