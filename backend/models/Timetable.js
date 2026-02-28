const mongoose = require("mongoose");
const timetableSchema = new mongoose.Schema(
  {
    classId: {
      type: Number, // or ObjectId if you link to Assignment
      required: true,
      unique: true,
    },
    timetable: {
      type: Map,
      of: [
        {
          hour: Number,
          subject: String, // ✅ keep this as string (subject name)
          teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
          homework: { type: String, default: "" },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
