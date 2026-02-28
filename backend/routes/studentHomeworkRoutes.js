const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Homework = require("../models/Homework");
const TimeTable = require("../models/Timetable");

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * GET /api/student-homework/:classId/today
 * Fetch today's homework for a class
 */
router.get("/:classId/today", async (req, res) => {
  try {
    const { classId } = req.params;
    const today = "monday"; // For testing, replace with: days[new Date().getDay()].toLowerCase()

    // Find all homework for this class today
    const homeworkList = await Homework.find({ classId: Number(classId), day: today })
      .populate("teacherId", "username") // get teacher name
      .lean();

    // Optional: also fetch timetable info (subject/hour)
    const timetable = await TimeTable.aggregate([
      { $match: { classId: Number(classId) } },
      { $project: { timetable: 1, _id: 0 } },
      { $unwind: { path: "$timetable.monday", preserveNullAndEmptyArrays: true } }, // adjust 'monday'
      { $project: { hour: "$timetable.monday.hour", subject: "$timetable.monday.subject", slotId: "$timetable.monday._id" } }
    ]);

    // Merge homework with timetable
    const hwMap = {};
    homeworkList.forEach(hw => {
      hwMap[hw.slotId.toString()] = { homeworkText: hw.homeworkText, teacher: hw.teacherId.username };
    });

    const merged = timetable.map(slot => ({
      hour: slot.hour,
      subject: slot.subject,
      homework: hwMap[slot.slotId?.toString()]?.homeworkText || "",
      teacher: hwMap[slot.slotId?.toString()]?.teacher || ""
    }));

    res.json(merged);
  } catch (err) {
    console.error("Error fetching student homework:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
