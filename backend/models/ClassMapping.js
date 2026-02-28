const mongoose = require('mongoose');

const classMappingSchema = new mongoose.Schema({
  stuClass: {
    type: Number,
    required: true,
    unique: true
  },
  subjects: {
    type: Map,      
    of: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // 👈 reference Teacher model
    default: {}
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null
  }
}, { timestamps: true });
module.exports = mongoose.model('Assignment', classMappingSchema);