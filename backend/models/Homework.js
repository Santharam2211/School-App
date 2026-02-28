// models/Homework.js
const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({
  classId: { type: Number, required: true },
  day: { type: String, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, required: true },
  homeworkText: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: String, // Add subject field
  hour: String, // Add hour field
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ['pending', 'finished'], default: 'pending' },
    completedAt: { type: Date }
  }],
  pdfAttachment: { type: String, default: null }, // Path to PDF file
  pdfOriginalName: { type: String, default: null } // Original filename for display
}, { timestamps: true });

module.exports = mongoose.model("Homework", homeworkSchema);