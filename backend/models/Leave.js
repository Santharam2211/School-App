const mongoose = require('mongoose');
const leaveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  from: Date,
  to: Date,
  reason: String,
  status: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' }
});
module.exports = mongoose.model('Leave', leaveSchema);
