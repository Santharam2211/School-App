const express = require("express");
const router = express.Router();
const Assignment = require("../models/ClassMapping");

router.get('/', async (req, res) => {
  try {
    const docs = await Assignment.find().populate('classTeacher');
    console.log('Raw docs from database:', docs);
    // return as map stuClass -> { subjects, classTeacher } mapping
    const map = {};
    docs.forEach(d => { 
      map[d.stuClass] = { 
        subjects: d.subjects, 
        classTeacher: d.classTeacher 
      }; 
    });
    console.log('Processed assignments map:', map);
    res.json(map);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});
router.put('/:stuClass', async (req, res) => {
 try {
    const stuClass = req.params.stuClass;
    const { subjects, classTeacher } = req.body;
    console.log("--------stuclass:"+stuClass);
    console.log("--------subjects:", subjects);
    console.log("--------classTeacher:", classTeacher);
    
    const updateData = { subjects };
    if (classTeacher !== undefined) {
      updateData.classTeacher = classTeacher;
    }
    
    console.log("--------updateData:", updateData);
    
    const doc = await Assignment.findOneAndUpdate({ stuClass }, updateData, { upsert: true, new: true });
    console.log("--------saved doc:", doc);
    res.json({ subjects: doc.subjects, classTeacher: doc.classTeacher });
    } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

module.exports = router;