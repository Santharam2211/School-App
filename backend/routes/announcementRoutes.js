const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");

// 🟢 Get all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// 🟢 Post new announcement
router.post("/", async (req, res) => {
  try {
    const { message, postedBy } = req.body;
    const newAnnouncement = new Announcement({ message, postedBy });
    await newAnnouncement.save();
    res.json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ error: "Failed to post announcement" });
  }
});

// 🟠 Update an announcement
router.put("/:id", async (req, res) => {
  try {
    const { message } = req.body;
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { message },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Announcement not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// 🔴 Delete an announcement
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Announcement not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

module.exports = router;





// const express = require("express");
// const { ObjectId } = require("mongodb");

// module.exports = (db) => {
//   const router = express.Router();
//   const collection = db.collection("announcements");

//   // 🟢 Get all announcements
//   router.get("/", async (req, res) => {
//     try {
//       const announcements = await collection
//         .find({})
//         .sort({ date: -1 })
//         .toArray();

//       res.json(announcements);
//     } catch (err) {
//       res.status(500).json({ error: "Failed to fetch announcements" });
//     }
//   });

//   // 🟢 Post new announcement
//   router.post("/", async (req, res) => {
//     try {
//       const { message, postedBy } = req.body;

//       const newAnnouncement = {
//         message,
//         postedBy,
//         date: new Date(),
//       };

//       const result = await collection.insertOne(newAnnouncement);

//       res.json({ ...newAnnouncement, _id: result.insertedId });
//     } catch (err) {
//       res.status(500).json({ error: "Failed to post announcement" });
//     }
//   });

//   // 🟠 Update announcement
//   router.put("/:id", async (req, res) => {
//     try {
//       const { message } = req.body;

//       if (!ObjectId.isValid(req.params.id)) {
//         return res.status(400).json({ error: "Invalid ID format" });
//       }

//       const result = await collection.findOneAndUpdate(
//         { _id: new ObjectId(req.params.id) },
//         { $set: { message } },
//         { returnDocument: "after" }
//       );

//       if (!result.value) {
//         return res.status(404).json({ error: "Announcement not found" });
//       }

//       res.json(result.value);
//     } catch (err) {
//       res.status(500).json({ error: "Failed to update announcement" });
//     }
//   });

//   // 🔴 Delete announcement
//   router.delete("/:id", async (req, res) => {
//     try {
//       if (!ObjectId.isValid(req.params.id)) {
//         return res.status(400).json({ error: "Invalid ID format" });
//       }

//       const result = await collection.deleteOne({
//         _id: new ObjectId(req.params.id),
//       });

//       if (result.deletedCount === 0) {
//         return res.status(404).json({ error: "Announcement not found" });
//       }

//       res.json({ message: "Deleted successfully" });
//     } catch (err) {
//       res.status(500).json({ error: "Failed to delete announcement" });
//     }
//   });

//   return router;
// };