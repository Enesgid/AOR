const verifyToken = require('./middleware/auth');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');  
const Submission = require('./models/Submission'); 
const Notification =require("./models/Notification")
const app = express();
const Settings = require("./models/Settings");
const schoolDepartments = require("./models/schoolDepartments");

// this prevent backdoor access to the API and only allows .
app.use(cors()); 
app.use(express.json()); 


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
   console.log("Creating notification:", {
        recipientRole,
        recipientDepartment,
        recipientSchool,
        recipientPFNumber,
        title,
        message,
    });
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
    console.log("Notification created successfully");
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
      return res.status(404).json({ message: "User not found. Please check your PF Number." });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `Access denied. You are registered as a ${user.role}, not a ${role}.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials. Incorrect password." });
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

      const submissions =
        await Submission.find({
          'lecturerDetails.department': {
            $regex: new RegExp(
              `^${department}$`,
              'i'
            )
          }
        }).sort({ createdAt: -1 });

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
app.post('/api/submissions',verifyToken, async (req, res) => {
  try {const newSubmission = new Submission(req.body);
const savedSubmission = await newSubmission.save();

await createNotification({
    recipientRole: "HOD",
    recipientDepartment:
        savedSubmission.lecturerDetails.department,
    title: "New Submission",
    message: `${savedSubmission.lecturerDetails.firstName} ${savedSubmission.lecturerDetails.lastName} submitted a new AOR form.`,
    type: "info",
    link: "/hod",
});

res.status(201).json(savedSubmission);
  } 
catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: 'Failed to save submission' });
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

app.put('/api/submissions/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSubmission = await Submission.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true } 
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ message: 'Server error while updating.' });
  }
});

app.get("/api/notifications", verifyToken, async (req, res) => {
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
    console.log("Received PF:", pfNumber);

    const cleanPF = pfNumber.trim().toUpperCase();

const user = await User.findOne({
  pfNumber: cleanPF,
});
    console.log("Found User:", user);

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
// --- MAGIC SETUP ROUTE (Creates test users with password "123") ---
app.get('/api/setup-users', async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123", salt); 
 await User.deleteMany({});
const users = [];
  users.push({
    name: "Prof. Dauda",
    pfNumber: "PF400",
    role: "Director",
    password: hashedPassword,
    firstLogin: true,
});
const deans = [
    { school: "SICT", pfNumber: "PF300" },
    { school: "SIPET", pfNumber: "PF301" },
    { school: "SFAT", pfNumber: "PF302" },
    { school: "SSTE", pfNumber: "PF303" },
    { school: "SAMET",pfNumber:"PF304" },
    { school: "SIT", pfNumber: "PF305" },
    { school: "SLS", pfNumber: "PF306" },
    { school: "SET", pfNumber: "PF307" },
    { school: "SAHS", pfNumber: "PF308" },

    { school: "SAFT", pfNumber: "PF309" },
    { school: "SAT", pfNumber: "PF310" },
    { school: "SEET", pfNumber: "PF311" },
    { school: "SPS", pfNumber: "PF312" },
    { school: "PGS", pfNumber: "PF313" },
    { school: "SBMS", pfNumber: "PF314" },
    { school: "SPhS", pfNumber: "PF315" },
];

deans.forEach((dean, index) => {
    users.push({
        name: `Dean ${index + 1}`,
        pfNumber: dean.pfNumber,
        role: "Dean",
        password: hashedPassword,
        school: dean.school,
        firstLogin: true,
    });
});
let hodCounter = 200;

Object.entries(schoolDepartments).forEach(
    ([school, departments]) => {

    departments.forEach((department) => {

        users.push({
            name: `HOD ${department}`,
            pfNumber: `PF${hodCounter}`,
            role: "HOD",
            password: hashedPassword,
            school,
            department,
            firstLogin: true,
        });

        hodCounter++;

    });

    }
);
let lecturerCounter = 1;
let lecturerPF = 500;

Object.entries(schoolDepartments).forEach(
    ([school, departments]) => {

        departments.forEach((department) => {

            for (let i = 1; i <= 14; i++) {

                users.push({
                    name: `Lecturer ${lecturerCounter}`,
                    pfNumber: `PF${lecturerPF}`,
                    role: "Lecturer",
                    password: hashedPassword,
                    school,
                    department,
                    firstLogin: true,
                });

                lecturerCounter++;
                lecturerPF++;

            }

        });

    }
);
await User.create(users);

  res.send("✅ Test users created successfully! You can now log in with ");
 } catch (error) {
    console.log(error);
    res.send("❌ Users might already exist, or there was an error.");
  }
}); 
app.put(
  "/api/users/profile",
  verifyToken,
  async (req, res) => {
    try {
      const { name } = req.body;

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user.id,
          { name },
          { new: true }
        );

      if (!updatedUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.json({
        message: "Profile updated successfully",
        user: {
          name: updatedUser.name,
          pfNumber: updatedUser.pfNumber,
          role: updatedUser.role,
          department:
            updatedUser.department,
          school: updatedUser.school,
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});