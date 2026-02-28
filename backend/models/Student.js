const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  rollNo: { type: String, unique: true },
  stuClass: Number, // 1 to 10
  mobile: String,
});

module.exports = mongoose.model('Student', studentSchema);
