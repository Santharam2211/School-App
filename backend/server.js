require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const User = require('./models/User')
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Assignment = require('./models/ClassMapping');
const announcementRoutes = require('./routes/announcementRoutes');


const studentRoutes = require('./routes/studentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const assignmentRoutes = require('./routes/AssignmentRoutes');
const teacherTimetableRoutes = require("./routes/teacherTimetableRoutes");
const leaveRoutes = require('./routes/leaveRoutes');

const app = express();
const http = require('http');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/school_admin';

mongoose.connect(MONGO)
    .then(() => console.log('Mongo connected'))
    .catch(err => console.error('Mongo error', err));

app.use(cors());
app.use(express.json());

// Seed demo users if they don't exist
async function ensureDemoUsers() {
    try {
        const demos = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'teacher1', password: 'teacher123', role: 'teacher' },
            { username: 'student1', password: 'student123', role: 'student' },
        ];
        for (const u of demos) {
            const existing = await User.findOne({ username: u.username });
            if (!existing) {
                await User.create(u);
                console.log(`Seeded user: ${u.username}/${u.role}`);
            }
        }
    } catch (err) {
        console.error('Error seeding demo users:', err.message);
    }
}

ensureDemoUsers();

// Ensure every student has a corresponding User
// Username is derived from student name (letters only, lowercase) for alphabetic login
function deriveStudentUsername(student) {
    // Use name stripped of spaces/special chars (e.g. 'John Doe' -> 'johndoe')
    // Fallback to rollNo string if name is missing
    const nameBased = (student.name || '').replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return nameBased || String(student.rollNo || '').trim().toLowerCase();
}

async function ensureStudentUsers() {
    try {
        const students = await Student.find().lean();
        let created = 0;
        for (const s of students) {
            const existingUser = await User.findById(s._id);
            if (!existingUser) {
                const username = deriveStudentUsername(s);
                await User.create({ _id: s._id, username, password: 'test1', role: 'student' });
                created += 1;
                console.log(`ensureStudentUsers: created user '${username}' for student ${s.name} (rollNo: ${s.rollNo})`);
            }
        }
        if (created > 0) console.log(`ensureStudentUsers: created ${created} missing user accounts for students`);
    } catch (err) {
        console.error('ensureStudentUsers error:', err.message);
    }
}

ensureStudentUsers();

app.use('/api/students', studentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use("/api/teacher-timetable", teacherTimetableRoutes);
app.use("/api/student-homework", require("./routes/studentHomeworkRoutes"));
app.use('/api/leaves', leaveRoutes);
app.use('/api/announcements', announcementRoutes);


// Homework routes
app.use('/api/homework', require('./routes/homeworkRoutes'));

// File serving routes
app.use('/api/files', require('./routes/fileRoutes'));

app.post('/login', async (req, res) => {
    const raw = req.body || {};
    const username = (raw.username || '').trim();
    const unameLc = username.toLowerCase();
    const password = (raw.password || '').trim();
    console.log('Login attempt ->', { username });

    try {
        // 1. Direct match: username (any letters/numbers)
        let user = await User.findOne({ username: unameLc, password });

        if (!user) {
            // 2. Fallback A: username might be the student's rollNo (numeric, old accounts)
            const studentByRoll = await Student.findOne({ rollNo: unameLc });
            if (studentByRoll) {
                let linked = await User.findOne({ _id: studentByRoll._id, password });
                if (linked) {
                    user = linked;
                } else if (password === 'test1') {
                    // Force-sync the user record so they can log in with default password
                    const syncUsername = deriveStudentUsername(studentByRoll.toObject ? studentByRoll.toObject() : studentByRoll);
                    await User.findByIdAndUpdate(
                        studentByRoll._id,
                        { username: syncUsername, password: 'test1', role: 'student' },
                        { upsert: true }
                    );
                    user = await User.findOne({ _id: studentByRoll._id, password: 'test1' });
                }
            }
        }

        if (!user) {
            // 3. Fallback B: try matching username against the student's rollNo stored on User model
            //    (for old accounts where username was set to rollNo, not the name)
            const userByRollUsername = await User.findOne({ username: unameLc });
            if (userByRollUsername && userByRollUsername.password === password) {
                user = userByRollUsername;
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const passwordIsDefault = user.role === 'student' && password === 'test1';

        // If user is a student, fetch and include student data
        let studentData = null;
        if (user.role === 'student') {
            try {
                const student = await Student.findById(user._id);
                if (student) {
                    studentData = {
                        name: student.name,
                        rollNo: student.rollNo,
                        stuClass: student.stuClass,
                        mobile: student.mobile
                    };
                }
            } catch (err) {
                console.error('Error fetching student data:', err);
            }
        }

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            passwordIsDefault,
            studentData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug route to get all users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug: find a user by username
app.get('/api/debug/user-by-username/:u', async (req, res) => {
    try {
        const u = await User.findOne({ username: req.params.u });
        if (!u) return res.status(404).json({ message: 'Not found' });
        res.json({ _id: u._id, username: u.username, role: u.role });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug: check mapping for student rollNo -> user
app.get('/api/debug/check-student/:rollNo', async (req, res) => {
    try {
        const s = await Student.findOne({ rollNo: req.params.rollNo });
        if (!s) return res.status(404).json({ message: 'Student not found' });
        const u = await User.findById(s._id);
        if (!u) return res.status(404).json({ message: 'Linked user not found for student', studentId: s._id });
        res.json({ studentId: s._id, studentRollNo: s.rollNo, userId: u._id, username: u.username, role: u.role });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug: force set/reset password for a student by rollNo
app.post('/api/debug/reset-student-password', async (req, res) => {
    try {
        const rollNo = (req.body.rollNo || '').trim();
        const newPassword = (req.body.password || '').trim();
        if (!rollNo || !newPassword) return res.status(400).json({ message: 'rollNo and password required' });
        const s = await Student.findOne({ rollNo });
        if (!s) return res.status(404).json({ message: 'Student not found' });
        const u = await User.findByIdAndUpdate(s._id, { username: rollNo, password: newPassword, role: 'student' }, { upsert: true, new: true });
        res.json({ ok: true, userId: u._id, username: u.username });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Migration: update all student Users whose username is still their numeric rollNo
// to use a name-based alphabetic username. Call once to fix existing accounts.
app.post('/api/migrate/student-usernames', async (req, res) => {
    try {
        const students = await Student.find().lean();
        const results = { updated: 0, skipped: 0, errors: [] };
        for (const s of students) {
            try {
                const u = await User.findById(s._id);
                if (!u) { results.errors.push(`No user for student ${s.name}`); continue; }
                // If username is currently the rollNo (numeric), migrate it to name-based
                const nameUsername = deriveStudentUsername(s);
                if (u.username !== nameUsername) {
                    await User.findByIdAndUpdate(s._id, { username: nameUsername });
                    console.log(`Migrated: ${u.username} -> ${nameUsername} for ${s.name}`);
                    results.updated++;
                } else {
                    results.skipped++;
                }
            } catch (err) {
                results.errors.push(`${s.name}: ${err.message}`);
            }
        }
        res.json({ ok: true, ...results });
    } catch (e) {
        res.status(500).json({ message: 'Migration failed', error: e.message });
    }
});


// Change password for current user by id
app.post('/api/users/:id/change-password', async (req, res) => {
    try {
        const newPassword = (req.body.newPassword || '').trim();
        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { password: newPassword }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Students routes are handled in routes/studentRoutes.js


// Teachers routes
app.get('/api/teachers', async (req, res) => {
    const teachers = await Teacher.find();
    res.json(teachers);
});
app.post('/api/teachers', async (req, res) => {
    console.log(req.body);
    try {
        // Store username in lowercase so login (which lowercases input) always matches
        const teacherUsername = (req.body.teacherId || '').trim().toLowerCase();
        const newUser = await User.create({
            _id: new mongoose.Types.ObjectId(),
            username: teacherUsername,
            password: req.body.password || "test1",
            role: "teacher"
        });
        const t = new Teacher({
            ...req.body,       // all fields from request body
            _id: newUser._id      // override _id
        });
        await t.save();                    // save to database
        res.status(201).json(t);           // return saved teacher object with _id
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding teacher', error: err.message });
    }
});
app.put('/api/teachers/:id', async (req, res) => {
    const t = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(t);
});
app.delete('/api/teachers/:id', async (req, res) => {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Assignments routes

/*app.get('/api/assignments', async (req, res) => {
  try {
    const docs = await Assignment.find();
    // return as map stuClass -> subjects mapping
    const map = {};
    docs.forEach(d => { map[d.stuClass] = d.subjects|| {}; });
    res.json(map);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});*/


// Create HTTP server and initialize Socket.IO once here to avoid circular deps
const server = http.createServer(app);
initSocket(server);
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://0.0.0.0:${PORT}`));
