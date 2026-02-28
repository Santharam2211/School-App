const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  mobile: String,
  email: String,
  homeAddress: String,
  subjects: [{ type: String, required: true }],
  isClassTeacher: { type: Boolean, default: false },
  assignedClass: { type: Number, default: null },
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: String,
});

module.exports = mongoose.model('Teacher', teacherSchema);
