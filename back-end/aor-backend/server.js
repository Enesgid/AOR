require('dotenv').config();
const verifyToken = require('./middleware/auth');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');  
const Submission = require('./models/Submission'); 
const Notification =require("./models/Notification")
const app = express();
const Settings = require("./models/Settings");
const schoolDepartments = require("./models/schoolDepartments");
const aiRoutes = require('./routes/aiRoutes');

// this prevent backdoor access to the API and only allows .
app.use(cors()); 
app.use(express.json()); 
app.use('/api/ai', aiRoutes);
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aor_database')
  .then(() => console.log('✅ MongoDB Successfully Connected!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));


app.get('/', (req, res) => {
  res.send('');
});
const createNotification = async ({
    recipientRole,
    recipientDepartment,
    recipientSchool,
    recipientPFNumber,
    title,
    message,
    type = "info",
    link = "",
}) => {
    await Notification.create({
        recipientRole,
        recipientDepartment,
        recipientSchool,
        recipientPFNumber,
        title,
        message,
        type,
        link,
    });
};
    
// --- REGISTER A NEW USER ---
app.post('/api/register', async (req, res) => {
  try {
    const { name, pfNumber, role, password, department, school } = req.body;

    const existingUser = await User.findOne({ pfNumber });
    if (existingUser) {
      return res.status(400).json({ message: "User with this PF Number already exists!" });
    }

    // Hash the password (scramble it 10 times for heavy security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      pfNumber,
      role,
      password: hashedPassword,
      department, // Added this
      school      // Added this  
});

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// --- LOGIN A USER ---
app.post('/api/login', async (req, res) => {
  try {
    const { pfNumber, password, role } = req.body;

    const user = await User.findOne({ pfNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. You are registered as a ${user.role}, not a ${role}.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: " Incorrect password or PF Number. " });
    }

    // generrate a json web token (JWT) that includes the user's ID, PF number, role, name, department, and school. This token will be used to authenticate future requests to protected routes.
    const token = jwt.sign(
      { 
        id: user._id, 
        pfNumber: user.pfNumber, 
        role: user.role, 
        name: user.name,
        department: user.department, 
        school: user.school 
      }, 
      'your_super_secret_key', 
      { expiresIn: '8h' } 
    );

    res.status(200).json({ 
      message: "Login successful!", 
      token, 
      user: { name: user.name, 
      pfNumber: user.pfNumber, 
      role: user.role,
      department: user.department,
      school: user.school,
      firstLogin: user.firstLogin
      } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// --- GET ALL SUBMISSIONS (Director Dashboard) ---
app.get('/api/submissions',verifyToken, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get distinct sessions (grouped) with most recent activity
app.get('/api/submissions/sessions', verifyToken, async (req, res) => {
  try {
    // Aggregate sessions and find the most recent submission date per session
    const sessions = await Submission.aggregate([
      { $match: { 'lecturerDetails.session': { $exists: true, $ne: '' } } },
      { $group: { _id: '$lecturerDetails.session', lastSub: { $max: '$createdAt' } } },
      { $sort: { lastSub: -1 } },
      { $project: { session: '$_id', _id: 0, lastSub: 1 } }
    ]);

    const settings = await Settings.findOne();

    res.json({
      currentSession: settings?.academicSession || null,
      sessions: sessions.map(s => s.session)
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Unable to load sessions' });
  }
});

// --- GET TOTAL LECTURER USERS (Schools submission rate) ---
app.get('/api/users/count', verifyToken, async (req, res) => {
  try {
    const totalLecturers = await User.countDocuments({ role: 'Lecturer' });
    res.json({ totalLecturers });
  } catch (error) {
    console.error('Error counting lecturer users:', error);
    res.status(500).json({ error: 'Failed to count lecturer users' });
  }
});

// --- GET SPECIFIC LECTURER SUBMISSIONS ---
app.get('/api/submissions/track/:pfNumber', verifyToken,async (req, res) => {
  try {
    const cleanPf = req.params.pfNumber.trim();
    const pfRegex = new RegExp('^' + cleanPf + '$', 'i');
    const submissions = await Submission.find({ 'lecturerDetails.pfNumber': req.params.pfNumber }).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (error) {
    console.error("Error finding submissions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get(
  '/api/submissions/department/:departmentName',
  verifyToken,
  async (req, res) => {
    try {
      const department =
        req.params.departmentName.trim();

      // sort department submissions by totalDesignatedInput desc (fallback to computed total)
      const submissions = await Submission.find({
        'lecturerDetails.department': {
          $regex: new RegExp(`^${department}$`, 'i')
        }
      });

      submissions.sort((a, b) => {
        const aTotal = Number(a.totalDesignatedInput) || (Array.isArray(a.teaching) ? a.teaching.reduce((s, r) => s + (parseFloat(r.qap) || 0), 0) : 0) + (Array.isArray(a.administrativeDuties) ? a.administrativeDuties.reduce((s, r) => s + (parseFloat(r.qap) || 0), 0) : 0) + (Array.isArray(a.research) ? a.research.reduce((s, r) => s + (parseFloat(r.percentInput) || 0), 0) : 0);
        const bTotal = Number(b.totalDesignatedInput) || (Array.isArray(b.teaching) ? b.teaching.reduce((s, r) => s + (parseFloat(r.qap) || 0), 0) : 0) + (Array.isArray(b.administrativeDuties) ? b.administrativeDuties.reduce((s, r) => s + (parseFloat(r.qap) || 0), 0) : 0) + (Array.isArray(b.research) ? b.research.reduce((s, r) => s + (parseFloat(r.percentInput) || 0), 0) : 0);
        return bTotal - aTotal;
      });

      res.json(submissions);

    } catch (error) {
      console.error(
        "Error finding department submissions:",
        error
      );

      res.status(500).json({
        message: "Server error"
      });
    }
  }
);

// --- SAVE A NEW FORM ---
app.get('/api/submissions',verifyToken, async (req, res) => {
  try {
    const filter = {};
    // allow optional filtering by session and semester
    if (req.query.session) {
      filter['lecturerDetails.session'] = req.query.session;
    }
    if (req.query.semester) {
      filter['lecturerDetails.semester'] = req.query.semester;
    }

    const submissions = await Submission.find(filter).sort({ createdAt: -1 });
    res.json(submissions);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

const normalizeSignatureDate = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const prepareSubmissionPayload = (incoming) => {
  const payload = { ...incoming };
  const lecturerDateFromRoot = normalizeSignatureDate(payload.lecturerSignatureDate);
  const lecturerDateFromNested = normalizeSignatureDate(payload.lecturerDetails?.lecturerSignatureDate);
  const finalLecturerDate = lecturerDateFromRoot || lecturerDateFromNested ||
    (payload.lecturerSignature ? new Date() : null);

  if (payload.lecturerDetails) {
    payload.lecturerDetails.lecturerSignatureDate = finalLecturerDate;
  }

  payload.lecturerSignatureDate = finalLecturerDate;

  return payload;
};

app.put('/api/submissions/:id', verifyToken, async (req, res) => {
  try {
    const payload = prepareSubmissionPayload(req.body);
    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ message: 'Failed to update submission' });
  }
});
  

// Directors Approval Pipeline 
app.patch(
  "/api/submissions/approve-school",
  verifyToken,
  async (req, res) => {
    try {
      const { schoolName } = req.body;

      if (!schoolName) {
        return res.status(400).json({
          message: "School name is required",
        });
      }

      const result = await Submission.updateMany(
        {
          "lecturerDetails.school": schoolName,
          status: "Pending Director",
        },
        {
          $set: {
            status: "Approved",
            directorSignature: `Director Approval - ${new Date().toLocaleDateString()}`,
            approvalDate: new Date(),
          },
        }
      );
      const approvedSubmissions = await Submission.find({
  "lecturerDetails.school": schoolName,
  status: "Approved",
});

for (const submission of approvedSubmissions) {
  await createNotification({
    recipientRole: "Lecturer",
    recipientPFNumber:
      submission.lecturerDetails.pfNumber,
    title: "AOR Approved",
    message:
      "Your Assignment of Responsibility has been fully approved by the Director.",
    type: "success",
    link: "/tracking",
  });
}

      res.status(200).json({
        message: `${result.modifiedCount} submissions approved successfully`,
      });
    } catch (error) {
      console.error(
        "School approval error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);
// --- UPDATE FORM STATUS (Pipeline Approvals & Rejections) ---
app.patch('/api/submissions/:id/status', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body }; 
    updateData.lastModified = new Date();

    const updatedSubmission = await Submission.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true } );
    // if lecturerSignature/hodSignature/deanSignature/directorSignature updated and no date provided, set corresponding dates
    let needsSave = false;
    if (updateData.lecturerSignature && !updateData.lecturerSignatureDate) {
      updatedSubmission.lecturerSignatureDate = new Date();
      needsSave = true;
    }
    if (updateData.hodSignature && !updateData.hodSignatureDate) {
      updatedSubmission.hodSignatureDate = new Date();
      needsSave = true;
    }
    if (updateData.deanSignature && !updateData.deanSignatureDate) {
      updatedSubmission.deanSignatureDate = new Date();
      needsSave = true;
    }
    if (updateData.directorSignature && !updateData.directorSignatureDate) {
      updatedSubmission.directorSignatureDate = new Date();
      needsSave = true;
    }
    if (needsSave) await updatedSubmission.save();
// Notify Dean when HOD approves
if (updatedSubmission.status === "Pending Dean") {
  await createNotification({
    recipientRole: "Dean",
    recipientSchool: updatedSubmission.lecturerDetails.school,
    title: "New Submission Awaiting Approval",
    message: `${updatedSubmission.lecturerDetails.firstName} ${updatedSubmission.lecturerDetails.lastName}'s AOR has been verified by the HOD and is awaiting your approval.`,
    type: "info",
    link: "/dean",
  });
}
if (updatedSubmission.status === "Pending Director") {
  await createNotification({
    recipientRole: "Director",
    title: "School Approval Awaiting Validation",
    message: `${updatedSubmission.lecturerDetails.school} has submitted an AOR awaiting Director validation.`,
    type: "info",
    link: "/director",
  });
}
// Notify Lecturer when Director approves
if (updatedSubmission.status === "Approved") {
  await createNotification({
    recipientPFNumber:
      updatedSubmission.lecturerDetails.pfNumber,

    title: "Submission Approved",

    message:
      "Congratulations! Your Assignment of Responsibility has received final approval.",

    type: "success",

    link: "/track-submission",
  });
}

    
    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error while updating status" });
  }
});

app.post('/api/submissions',verifyToken, async (req, res) => {
  try {
    const incoming = req.body;
    const pf = incoming?.lecturerDetails?.pfNumber;
    const session = incoming?.lecturerDetails?.session;
    const semester = incoming?.lecturerDetails?.semester;

    if (!pf) {
      return res.status(400).json({ message: 'Missing lecturer PF number' });
    }

    // Prevent duplicate submission for same lecturer + session + semester
    const existing = await Submission.findOne({
      'lecturerDetails.pfNumber': pf,
      'lecturerDetails.session': session,
      'lecturerDetails.semester': semester,
    });

    if (existing) {
      return res.status(400).json({ message: 'A submission for this session and semester already exists for this lecturer.' });
    }

    const cleanPayload = prepareSubmissionPayload(incoming);
    const newSubmission = new Submission(cleanPayload);
    newSubmission.totalDesignatedInput = cleanPayload.totalDesignatedInput || 0;
    const savedSubmission = await newSubmission.save();

    await createNotification({
      recipientRole: "HOD",
      recipientDepartment: savedSubmission.lecturerDetails.department,
      title: "New Submission",
      message: `${savedSubmission.lecturerDetails.firstName} ${savedSubmission.lecturerDetails.lastName} submitted a new AOR form.`,
      type: "info",
      link: "/hod",
    });

    res.status(201).json(savedSubmission);
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { role, department, school, pfNumber } = req.user;

    let query = {};

    switch (role) {
      case "HOD":
        query = {
          recipientRole: "HOD",
          recipientDepartment: department,
        };
        break;

      case "Dean":
        query = {
          recipientRole: "Dean",
          recipientSchool: school,
        };
        break;

      case "Director":
        query = {
          recipientRole: "Director",
        };
        break;

      case "Lecturer":
        query = {
          recipientPFNumber: pfNumber,
        };
        break;

      default:
        query = {
          _id: null,
        };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to fetch notifications",
    });
  }
});

app.patch(
  "/api/notifications/read-all",
  verifyToken,
  async (req, res) => {

    try {

      const {
        role,
        department,
        school,
        pfNumber,
      } = req.user;

      let query = {};

      switch (role) {

        case "HOD":
          query = {
            recipientRole: "HOD",
            recipientDepartment: department,
          };
          break;

        case "Dean":
          query = {
            recipientRole: "Dean",
            recipientSchool: school,
          };
          break;

        case "Director":
          query = {
            recipientRole: "Director",
          };
          break;

        case "Lecturer":
          query = {
            recipientPFNumber: pfNumber,
          };
          break;
      }

      await Notification.updateMany(
        query,
        {
          $set: {
            read: true,
          },
        }
      );

      res.json({
        message: "Notifications marked as read.",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Unable to update notifications",
      });

    }

  }
);
app.patch(
  "/api/notifications/:id/read",
  verifyToken,
  async (req, res) => {
    try {

      const notification =
        await Notification.findByIdAndUpdate(
          req.params.id,
          {
            read: true,
          },
          {
            new: true,
          }
        );

      res.json(notification);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Unable to update notification",
      });
    }
  }
);

app.delete(
  "/api/notifications",
  verifyToken,
  async (req, res) => {

    try {

      const { role, department, school, pfNumber } = req.user;

      let query = {};

      switch (role) {

        case "HOD":
          query = {
            recipientRole: "HOD",
            recipientDepartment: department,
          };
          break;

        case "Dean":
          query = {
            recipientRole: "Dean",
            recipientSchool: school,
          };
          break;

        case "Director":
          query = {
            recipientRole: "Director",
          };
          break;

        case "Lecturer":
          query = {
            recipientPFNumber: pfNumber,
          };
          break;
      }

      await Notification.deleteMany(query);

      res.json({
        message: "Notifications cleared.",
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Unable to clear notifications",
      });

    }

  }
);
app.put(
  "/api/users/change-password",
  verifyToken,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      const user = await User.findById(
        req.user.id
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const correctPassword =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!correctPassword) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const salt =
        await bcrypt.genSalt(10);

      user.password =
        await bcrypt.hash(
          newPassword,
          salt
        );

      await user.save();

      res.json({
        message:
          "Password updated successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Unable to update password",
      });
    }
  }
);
app.post("/api/users/reset-password", async (req, res) => {
  try {
    const { pfNumber, name } = req.body;
    const cleanPF = pfNumber.trim().toUpperCase();

const user = await User.findOne({
  pfNumber: cleanPF,
});

    if (!user) {
      return res.status(404).json({
        message: "PF Number not found.",
      });
    }

    if (
      user.name.trim().toLowerCase() !==
      name.trim().toLowerCase()
    ) {
      return res.status(400).json({
        message: "Name does not match our records.",
      });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      "123",
      salt
    );

    user.firstLogin = true;

    await user.save();

    res.json({
  message:
    "Password has been reset successfully. Login with password: 123",
  role: user.role,
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to reset password.",
    });
  }
});
app.put(
  "/api/users/first-login",
  verifyToken,
  async (req, res) => {
    try {
      const {
        name,
        pfNumber,
        currentPassword,
        newPassword, 
      } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const salt = await bcrypt.genSalt(10);

      user.name = name.trim();
      console.log(req.body);
      user.pfNumber = pfNumber.trim().toUpperCase();

      user.password = await bcrypt.hash(
        newPassword,
        salt
      );

      user.firstLogin = false;

      await user.save();

const token = jwt.sign(
  {
    id: user._id,
    name: user.name,
    pfNumber: user.pfNumber,
    role: user.role,
    department: user.department,
    school: user.school,
    firstLogin: user.firstLogin,
  },
  "your_super_secret_key",
  { expiresIn: "1d" }
);

res.json({
  message: "Profile updated successfully",
  token,
  user: {
    name: user.name,
    pfNumber: user.pfNumber,
    role: user.role,
    department: user.department,
    school: user.school,
    firstLogin: user.firstLogin,
  },
});

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Unable to update profile",
      });
    }
  }
);
app.delete(
  "/api/submissions/delete-all",
  verifyToken,
  async (req, res) => {
    try {
      if (req.user.role !== "Director") {
        return res.status(403).json({
          message: "Only the Director can delete all submissions.",
        });
      }

      await Submission.deleteMany({});

      res.json({
        success: true,
        message: "All submissions deleted successfully.",
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);
 
app.put(
  "/api/users/profile",
  verifyToken,
  async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const pfNumber = String(req.body.pfNumber || "").trim().toUpperCase();

      if (!name || !pfNumber) {
        return res.status(400).json({
          message: "Name and PF Number are required.",
        });
      }

      const currentUser = await User.findById(req.user.id);

      if (!currentUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const pfExists = await User.findOne({
        pfNumber,
        _id: { $ne: req.user.id },
      });

      if (pfExists) {
        return res.status(409).json({
          message: "This PF Number is already in use.",
        });
      }

      currentUser.name = name;
      currentUser.pfNumber = pfNumber;

      await currentUser.save();

      const token = jwt.sign(
        {
          id: currentUser._id,
          name: currentUser.name,
          pfNumber: currentUser.pfNumber,
          role: currentUser.role,
          department: currentUser.department,
          school: currentUser.school,
          firstLogin: currentUser.firstLogin,
        },
        "your_super_secret_key",
        { expiresIn: "1d" }
      );

      res.json({
        message: "Profile updated successfully",
        token,
        user: {
          name: currentUser.name,
          pfNumber: currentUser.pfNumber,
          role: currentUser.role,
          department: currentUser.department,
          school: currentUser.school,
          firstLogin: currentUser.firstLogin,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Unable to update profile",
      });
    }
  }
);
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await Settings.create({
        academicSession: "2025/2026",
        semester: "First Semester",
      });
    }

    res.json(settings);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load settings",
    });
  }
});
app.put(
  "/api/settings",
  verifyToken,
  async (req, res) => {
    try {

      if (req.user.role !== "Director") {
        return res.status(403).json({
          message: "Only the Director can update institution settings.",
        });
      }

      let settings = await Settings.findOne();

      if (!settings) {
        settings = new Settings();
      }

      settings.academicSession =
        req.body.academicSession;

      settings.semester =
        req.body.semester;

      settings.submissionDeadline =
        req.body.submissionDeadline;

      settings.approvalDeadline =
        req.body.approvalDeadline;

      await settings.save();

      res.json({
        message: "Institution settings updated successfully.",
        settings,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message: "Unable to update settings.",
      });

    }
  }
);
app.get('/api/setup-users', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        message: 'User seeding is disabled in production. Use a secure admin route instead.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    const usersToUpsert = [
      {
        name: 'Prof. S.M Dauda',
        pfNumber: '400',
        role: 'Director',
        password: hashedPassword,
        school: 'Office of the Director',
        department: '',
        firstLogin: true,
      }
    ];

    const deans = [
      { school: 'SICT', pfNumber: '300' },
      { school: 'SIPET', pfNumber: '301' },
      { school: 'SFAT', pfNumber: '302' },
      { school: 'SSTE', pfNumber: '303' },
      { school: 'SAMET', pfNumber: '304' },
      { school: 'SIT', pfNumber: '305' },
      { school: 'SLS', pfNumber: '306' },
      { school: 'SET', pfNumber: '307' },
      { school: 'SAHS', pfNumber: '308' },
      { school: 'SAFT', pfNumber: '309' },
      { school: 'SAT', pfNumber: '310' },
      { school: 'SEET', pfNumber: '311' },
      { school: 'SPS', pfNumber: '312' },
      { school: 'PGS', pfNumber: '313' },
      { school: 'SBMS', pfNumber: '314' },
      { school: 'SPhS', pfNumber: '315' },
    ];

    deans.forEach((dean) => {
      usersToUpsert.push({
        name: 'Dean of ' + dean.school,
        pfNumber: dean.pfNumber,
        role: 'Dean',
        password: hashedPassword,
        school: dean.school,
        department: 'Dean Office',
        firstLogin: true,
      });
    });

    let hodCounter = 200;
    Object.entries(schoolDepartments).forEach(([school, departments]) => {
      departments.forEach((department) => {
        usersToUpsert.push({
          name: 'HOD ' + department,
          pfNumber: String(hodCounter),
          role: 'HOD',
          password: hashedPassword,
          school,
          department,
          firstLogin: true,
        });
        hodCounter++;
      });
    });

    let lecturerCounter = 1;
    let lecturerPF = 500;
    Object.entries(schoolDepartments).forEach(([school, departments]) => {
      departments.forEach((department) => {
        for (let i = 1; i <= 78; i++) {
          usersToUpsert.push({
            name: 'Lecturer ' + lecturerCounter,
            pfNumber: String(lecturerPF),
            role: 'Lecturer',
            password: hashedPassword,
            school,
            department,
            firstLogin: true,
          });

          lecturerCounter++;
          lecturerPF++;
        }
      });
    });

    const upsertResults = await Promise.all(
      usersToUpsert.map((userData) =>
        User.findOneAndUpdate(
          { pfNumber: userData.pfNumber },
          { $set: userData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    res.json({
      message: '✅ Existing users were updated and missing department users were added for local development.',
      createdOrUpdated: upsertResults.length,
      defaultPassword: '123',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: '❌ There was an error updating users.'
    });
  }
});

app.patch('/api/users/reset-all-passwords', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Director') {
      return res.status(403).json({
        message: 'Only the Director can reset all user passwords.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123', salt);

    const result = await User.updateMany(
      {},
      {
        $set: {
          password: defaultPassword,
          firstLogin: true,
        }
      }
    );

    res.json({
      message: 'All user passwords were reset to 123.',
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Unable to reset all passwords.'
    });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
