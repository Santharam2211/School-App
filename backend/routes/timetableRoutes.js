// timetableRoutes.js - Admin Timetable Management
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const TimeTable = require("../models/Timetable");

/**
 * GET /api/timetable/:classId
 * Fetch timetable for a specific class
 */
router.get("/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    
    let timetable = await TimeTable.findOne({ classId: Number(classId) });
    
    // If no timetable exists, create an empty one
    if (!timetable) {
      timetable = new TimeTable({
        classId: Number(classId),
        timetable: {}
      });
      await timetable.save();
    }
    
    res.json(timetable);
  } catch (err) {
    console.error("Error fetching timetable:", err);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
});

/**
 * PUT /api/timetable/:classId
 * Update timetable for a specific class
 */
router.put("/:classId", async (req, res) => {
  try {
    const { classId } = req.params;
    const { timetable } = req.body;
    
    if (!timetable) {
      return res.status(400).json({ error: "Timetable data is required" });
    }
    
    // Process timetable to convert teacher IDs to ObjectId
    const processedTimetable = {};
    for (const [day, slots] of Object.entries(timetable)) {
      processedTimetable[day] = slots.map(slot => {
        const processedSlot = { ...slot };
        
        // Convert teacher ID to ObjectId if it exists and is valid
        if (slot.teacher && mongoose.Types.ObjectId.isValid(slot.teacher)) {
          processedSlot.teacher = new mongoose.Types.ObjectId(slot.teacher);
        } else if (slot.teacher) {
          // If teacher exists but is not a valid ObjectId, keep it as is
          processedSlot.teacher = slot.teacher;
        } else {
          // If no teacher, set to null
          processedSlot.teacher = null;
        }
        
        return processedSlot;
      });
    }
    
    // Find and update, or create if doesn't exist
    const updated = await TimeTable.findOneAndUpdate(
      { classId: Number(classId) },
      { timetable: processedTimetable },
      { upsert: true, new: true, useFindAndModify: false }
    );
    
    console.log(`Timetable updated for class ${classId} with teacher assignments`);
    
    res.json({
      success: true,
      message: "Timetable updated successfully",
      timetable: updated
    });
  } catch (err) {
    console.error("Error updating timetable:", err);
    res.status(500).json({ error: "Failed to update timetable" });
  }
});

/**
 * GET /api/timetable
 * Fetch all timetables
 */
router.get("/", async (req, res) => {
  try {
    const timetables = await TimeTable.find();
    res.json(timetables);
  } catch (err) {
    console.error("Error fetching all timetables:", err);
    res.status(500).json({ error: "Failed to fetch timetables" });
  }
});

module.exports = router;