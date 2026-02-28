const Teacher = require('../models/Teacher');

exports.addTeacher = async (req, res) => {
  const teacher = await Teacher.create(req.body);
  res.json(teacher);
};

exports.getAllTeachers = async (req, res) => {
  const teachers = await Teacher.find();
  res.json(teachers);
};

exports.updateTeacher = async (req, res) => {
  const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(teacher);
};

exports.deleteTeacher = async (req, res) => {
  await Teacher.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
};
