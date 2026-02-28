const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: String, // admin username
    default: "admin",
  },
});

module.exports = mongoose.model("Announcement", announcementSchema);
