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

const normalizePfValue = (value) => String(value ?? '').trim().toUpperCase();

const findPfConflict = async ({ userId, pfValue }) => {
  const normalized = normalizePfValue(pfValue);
  if (!normalized) {
    return null;
  }

  // Temporary login PF values are not permanent identity records.
  // Only an official PF already assigned to another user should block update.
  return User.findOne({
    _id: { $ne: userId },
    officialPfNumber: normalized,
  });
};

// this prevent backdoor access to the API and only allows authorized logged in.
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
    const normalizedPf = normalizePfValue(pfNumber);
    const generalPfNumber = role === "Lecturer" ? normalizedPf : role === "Director" ? `${role?.charAt(0)?.toUpperCase()}${pfNumber}R` : `${role?.charAt(0)?.toUpperCase()}${pfNumber}`;
    let user = null;

    // Completed users must authenticate by their official PF because that is the active login identity.
    user = await User.findOne({
      officialPfNumber: generalPfNumber,
      role,
      firstLogin: false,
    });

    // First-time users still authenticate by their temporary PF.
    if (!user) {
      user = await User.findOne({
        pfNumber: generalPfNumber,
        role,
        firstLogin: true,
      });
    }
    // Legacy lecturer fallback: a completed lecturer with no official PF still logs in by original PF + role.
    if (!user) {
      user = await User.findOne({
        pfNumber: generalPfNumber,
        role: 'Lecturer',
        firstLogin: false,
        officialPfNumber: null,
      });
    }

    if (!user) {
      return res.status(404).json({
        message: "User has been assigned or User not found"
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: `Access denied. You are registered as a ${user.role}, not a ${role}.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: " Incorrect password or PF Number. " });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const activePfNumber = user.officialPfNumber || user.pfNumber;

    const token = jwt.sign(
      {
        id: user._id,
        pfNumber: activePfNumber,
        officialPfNumber: user.officialPfNumber || null,
        role: user.role,
        name: user.name,
        department: user.department,
        school: user.school,
        firstLogin: user.firstLogin,
      },
      'your_super_secret_key',
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        name: user.name,
        pfNumber: activePfNumber,
        officialPfNumber: user.officialPfNumber || null,
        role: user.role,
        department: user.department,
        school: user.school,
        firstLogin: user.firstLogin,
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// --- GET SUBMISSIONS FOR THE ACTIVE OR HISTORICAL ACADEMIC CYCLE ---
app.get('/api/submissions', verifyToken, async (req, res) => {
  try {
    const requestedSession = req.query.session ? String(req.query.session).trim() : '';
    const requestedSemester = req.query.semester ? String(req.query.semester).trim() : '';
    const supportedSemesters = ['First Semester', 'Second Semester'];

    const settings = await Settings.findOne();
    const activeSession = settings?.academicSession || '2025/2026';
    const activeSemester = settings?.semester || 'First Semester';

    const hasSession = Boolean(requestedSession);
    const hasSemester = Boolean(requestedSemester);

    if (hasSession !== hasSemester) {
      return res.status(400).json({
        message: 'Both session and semester are required together.',
      });
    }

    if (!hasSession && !hasSemester) {
      const submissions = await Submission.find({
        'lecturerDetails.session': activeSession,
        'lecturerDetails.semester': activeSemester,
      }).sort({ createdAt: -1 });

      return res.json(submissions);
    }

    if (!supportedSemesters.includes(requestedSemester)) {
      return res.status(400).json({
        message: 'Unsupported semester. Use First Semester or Second Semester.',
      });
    }

    if (req.user.role !== 'Director') {
      const requestedCycle = {
        session: requestedSession,
        semester: requestedSemester,
      };
      const activeCycle = {
        session: activeSession,
        semester: activeSemester,
      };

      if (
        requestedCycle.session !== activeCycle.session ||
        requestedCycle.semester !== activeCycle.semester
      ) {
        return res.status(403).json({
          message: 'You are only allowed to view the active academic cycle.',
        });
      }
    }

    const submissions = await Submission.find({
      'lecturerDetails.session': requestedSession,
      'lecturerDetails.semester': requestedSemester,
    }).sort({ createdAt: -1 });

    return res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
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

app.get('/api/submissions/lecturer/:pfNumber', verifyToken, async (req, res) => {
  try {
    const requestedPf = String(req.params.pfNumber || '').trim();
    const activePf = String(req.user?.officialPfNumber || req.user?.pfNumber || '').trim();

    if (req.user?.role === 'Lecturer' && requestedPf && activePf && requestedPf.toUpperCase() !== activePf.toUpperCase()) {
      return res.status(403).json({ message: 'You can only access your own submission records.' });
    }

    const query = {
      'lecturerDetails.pfNumber': requestedPf,
    };

    if (req.query.session) {
      query['lecturerDetails.session'] = req.query.session;
    }

    if (req.query.semester) {
      query['lecturerDetails.semester'] = req.query.semester;
    }

    const submission = await Submission.findOne(query).sort({ createdAt: -1 });

    if (!submission) {
      return res.status(404).json({ message: 'No submission found for the selected academic cycle.' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching lecturer submission:', error);
    res.status(500).json({ message: 'Server error fetching lecturer submission' });
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

const getActiveAcademicCycle = async () => {
  const settings = await Settings.findOne();
  const activeSession = settings?.academicSession || '2025/2026';
  const activeSemester = settings?.semester || 'First Semester';

  return {
    activeSession,
    activeSemester,
  };
};

app.post('/api/submissions', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Lecturer') {
      return res.status(403).json({ message: 'Only lecturers can submit AOR forms.' });
    }

    const userRecord = await User.findById(req.user.id);
    if (!userRecord) {
      return res.status(401).json({ message: 'Authenticated lecturer record not found.' });
    }

    const activePf = normalizePfValue(userRecord.officialPfNumber || userRecord.pfNumber);
    const incoming = req.body || {};
    const incomingLecturerDetails = incoming.lecturerDetails || {};
    const submittedPf = normalizePfValue(incomingLecturerDetails.pfNumber);
    const submittedSchool = String(incomingLecturerDetails.school || '').trim();
    const submittedDepartment = String(incomingLecturerDetails.department || '').trim();
    // const expectedSchool = String(userRecord.school || '').trim();
    // const expectedDepartment = String(userRecord.department || '').trim();

    if (!activePf) {
      return res.status(400).json({ message: 'Authenticated lecturer PF number is missing.' });
    }

    if (submittedPf && submittedPf !== activePf) {
      return res.status(403).json({ message: 'You cannot create a submission using another lecturer PF number.' });
    }

    // if (!expectedSchool || !expectedDepartment) {
    //   return res.status(400).json({ message: 'Authenticated lecturer school and department are not assigned.' });
    // }

    // if (submittedSchool && submittedSchool.toLowerCase() !== expectedSchool.toLowerCase()) {
    //   return res.status(403).json({ message: 'Submitted school does not match your assigned school.' });
    // }

    // if (submittedDepartment && submittedDepartment.toLowerCase() !== expectedDepartment.toLowerCase()) {
    //   return res.status(403).json({ message: 'Submitted department does not match your assigned department.' });
    // }

    const { activeSession, activeSemester } = await getActiveAcademicCycle();
    const requestedSession = String(incomingLecturerDetails.session || '').trim();
    const requestedSemester = String(incomingLecturerDetails.semester || '').trim();

    if (!requestedSession || !requestedSemester) {
      return res.status(400).json({ message: 'Academic session and semester are required.' });
    }

    if (!['First Semester', 'Second Semester'].includes(requestedSemester)) {
      return res.status(400).json({ message: 'Unsupported semester. Use First Semester or Second Semester.' });
    }

    if (requestedSession !== activeSession || requestedSemester !== activeSemester) {
      return res.status(400).json({ message: 'Submission cycle does not match the active institutional academic cycle.' });
    }

    const duplicate = await Submission.findOne({
      'lecturerDetails.pfNumber': activePf,
      'lecturerDetails.session': activeSession,
      'lecturerDetails.semester': activeSemester,
    });

    if (duplicate) {
      return res.status(400).json({ message: 'A submission for this session and semester already exists for this lecturer.' });
    }

    const sanitizedLecturerDetails = {
      firstName: String(incomingLecturerDetails.firstName || '').trim(),
      lastName: String(incomingLecturerDetails.lastName || '').trim(),
      middleInitial: String(incomingLecturerDetails.middleInitial || '').trim(),
      appointment: String(incomingLecturerDetails.appointment || '').trim(),
      pfNumber: activePf,
      school: submittedSchool,
      department: submittedDepartment ,
      position: String(incomingLecturerDetails.position || '').trim(),
      phone: String(incomingLecturerDetails.phone || '').trim(),
      salaryGrade: String(incomingLecturerDetails.salaryGrade || '').trim(),
      teachingCredit: String(incomingLecturerDetails.teachingCredit || '').trim(),
      leave: String(incomingLecturerDetails.leave || '').trim(),
      session: activeSession,
      semester: activeSemester,
      lecturerSignature: String(incomingLecturerDetails.lecturerSignature || incoming.lecturerSignature || '').trim(),
      lecturerSignatureDate: normalizeSignatureDate(
        incomingLecturerDetails.lecturerSignatureDate || incoming.lecturerSignatureDate ||
        (incomingLecturerDetails.lecturerSignature || incoming.lecturerSignature ? new Date() : null)
      ),
    };

    const cleanPayload = {
      lecturerDetails: sanitizedLecturerDetails,
      teaching: Array.isArray(incoming.teaching) ? incoming.teaching : [],
      administrativeDuties: Array.isArray(incoming.administrativeDuties) ? incoming.administrativeDuties : [],
      research: Array.isArray(incoming.research) ? incoming.research : [],
      communityService: Array.isArray(incoming.communityService) ? incoming.communityService : [],
      totalDesignatedInput: Number(incoming.totalDesignatedInput) || 0,
      lecturerSignature: sanitizedLecturerDetails.lecturerSignature,
      lecturerSignatureDate: sanitizedLecturerDetails.lecturerSignatureDate,
      status: 'Pending HOD',
      hodSignature: '',
      deanSignature: '',
      directorSignature: '',
      hodSignatureDate: null,
      deanSignatureDate: null,
      directorSignatureDate: null,
      rejectionReason: '',
      rejectedBy: '',
      approvalDate: null,
      submittedAt: new Date(),
    };

    const savedSubmission = await Submission.create(cleanPayload);

    await createNotification({
      recipientRole: 'HOD',
      recipientDepartment: savedSubmission.lecturerDetails.department,
      title: 'New Submission',
      message: `${savedSubmission.lecturerDetails.firstName} ${savedSubmission.lecturerDetails.lastName} submitted a new AOR form.`,
      type: 'info',
      link: '/hod',
    });

    res.status(201).json(savedSubmission);
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

app.put('/api/submissions/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Lecturer') {
      return res.status(403).json({ message: 'Only lecturers can update their AOR forms.' });
    }

    const existingSubmission = await Submission.findById(req.params.id);
    if (!existingSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const activePf = normalizePfValue(req.user.officialPfNumber || req.user.pfNumber);
    const storedPf = normalizePfValue(existingSubmission?.lecturerDetails?.pfNumber);

    if (!storedPf || storedPf !== activePf) {
      return res.status(403).json({ message: 'You can only edit your own submission records.' });
    }

    if (existingSubmission.status !== 'Rejected') {
      return res.status(409).json({ message: 'This submission is no longer editable by the lecturer.' });
    }

    const incoming = req.body || {};
    const incomingLecturerDetails = incoming.lecturerDetails || {};
    const requestPf = normalizePfValue(incomingLecturerDetails.pfNumber);

    if (requestPf && requestPf !== activePf) {
      return res.status(403).json({ message: 'You cannot change the lecturer PF number on a submission.' });
    }

    const submittedSchool = String(incomingLecturerDetails.school || '').trim();
    const submittedDepartment = String(incomingLecturerDetails.department || '').trim();
    const currentSchool = String(existingSubmission.lecturerDetails?.school || '').trim();
    const currentDepartment = String(existingSubmission.lecturerDetails?.department || '').trim();

    if (submittedSchool && submittedSchool.toLowerCase() !== currentSchool.toLowerCase()) {
      return res.status(403).json({ message: 'You cannot change your school through this edit.' });
    }

    if (submittedDepartment && submittedDepartment.toLowerCase() !== currentDepartment.toLowerCase()) {
      return res.status(403).json({ message: 'You cannot change your department through this edit.' });
    }

    const incomingSession = String(incomingLecturerDetails.session || existingSubmission.lecturerDetails?.session || '').trim();
    const incomingSemester = String(incomingLecturerDetails.semester || existingSubmission.lecturerDetails?.semester || '').trim();

    if (incomingSession && incomingSession !== existingSubmission.lecturerDetails?.session) {
      return res.status(403).json({ message: 'You cannot change the academic session through this edit.' });
    }

    if (incomingSemester && incomingSemester !== existingSubmission.lecturerDetails?.semester) {
      return res.status(403).json({ message: 'You cannot change the academic semester through this edit.' });
    }

    const updatedLecturerDetails = {
      ...existingSubmission.lecturerDetails,
      firstName: String(incomingLecturerDetails.firstName ?? existingSubmission.lecturerDetails?.firstName ?? '').trim(),
      lastName: String(incomingLecturerDetails.lastName ?? existingSubmission.lecturerDetails?.lastName ?? '').trim(),
      middleInitial: String(incomingLecturerDetails.middleInitial ?? existingSubmission.lecturerDetails?.middleInitial ?? '').trim(),
      appointment: String(incomingLecturerDetails.appointment ?? existingSubmission.lecturerDetails?.appointment ?? '').trim(),
      pfNumber: storedPf,
      school: currentSchool,
      department: currentDepartment,
      session: existingSubmission.lecturerDetails?.session,
      semester: existingSubmission.lecturerDetails?.semester,
      position: String(incomingLecturerDetails.position ?? existingSubmission.lecturerDetails?.position ?? '').trim(),
      phone: String(incomingLecturerDetails.phone ?? existingSubmission.lecturerDetails?.phone ?? '').trim(),
      salaryGrade: String(incomingLecturerDetails.salaryGrade ?? existingSubmission.lecturerDetails?.salaryGrade ?? '').trim(),
      teachingCredit: String(incomingLecturerDetails.teachingCredit ?? existingSubmission.lecturerDetails?.teachingCredit ?? '').trim(),
      leave: String(incomingLecturerDetails.leave ?? existingSubmission.lecturerDetails?.leave ?? '').trim(),
      lecturerSignature: String(incomingLecturerDetails.lecturerSignature ?? existingSubmission.lecturerDetails?.lecturerSignature ?? '').trim(),
      lecturerSignatureDate: normalizeSignatureDate(
        incomingLecturerDetails.lecturerSignatureDate || incoming.lecturerSignatureDate ||
        (incomingLecturerDetails.lecturerSignature || incoming.lecturerSignature ? new Date() : existingSubmission.lecturerDetails?.lecturerSignatureDate)
      ),
    };

    const nextBody = {
      lecturerDetails: updatedLecturerDetails,
      teaching: Array.isArray(incoming.teaching) ? incoming.teaching : existingSubmission.teaching || [],
      administrativeDuties: Array.isArray(incoming.administrativeDuties) ? incoming.administrativeDuties : existingSubmission.administrativeDuties || [],
      research: Array.isArray(incoming.research) ? incoming.research : existingSubmission.research || [],
      communityService: Array.isArray(incoming.communityService) ? incoming.communityService : existingSubmission.communityService || [],
      totalDesignatedInput: Number(incoming.totalDesignatedInput) || Number(existingSubmission.totalDesignatedInput) || 0,
      lecturerSignature: updatedLecturerDetails.lecturerSignature,
      lecturerSignatureDate: updatedLecturerDetails.lecturerSignatureDate,
      status: 'Pending HOD',
      hodSignature: '',
      deanSignature: '',
      directorSignature: '',
      hodSignatureDate: null,
      deanSignatureDate: null,
      directorSignatureDate: null,
      rejectionReason: '',
      rejectedBy: '',
      approvalDate: null,
      lastModified: new Date(),
    };

    const updatedSubmission = await Submission.findOneAndUpdate(
      {
        _id: existingSubmission._id,
        'lecturerDetails.pfNumber': storedPf,
        status: 'Rejected',
      },
      { $set: nextBody },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(409).json({ message: 'This rejected submission can no longer be updated.' });
    }

    await createNotification({
      recipientRole: 'HOD',
      recipientDepartment: updatedSubmission.lecturerDetails.department,
      title: 'Submission Resubmitted',
      message: `${updatedSubmission.lecturerDetails.firstName} ${updatedSubmission.lecturerDetails.lastName} resubmitted an AOR form for HOD review.`,
      type: 'info',
      link: '/hod',
    });

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
      if (req.user.role !== "Director") {
        return res.status(403).json({
          message: "Only the Director can approve an entire school.",
        });
      }

      const schoolName = String(req.body?.schoolName || "").trim();
      const requestedSession = String(req.body?.session || "").trim();
      const requestedSemester = String(req.body?.semester || "").trim();
      const supportedSemesters = ["First Semester", "Second Semester"];

      if (!schoolName) {
        return res.status(400).json({
          message: "School name is required",
        });
      }

      let finalSession = requestedSession;
      let finalSemester = requestedSemester;

      if (!finalSession && !finalSemester) {
        const settings = await Settings.findOne();
        finalSession = settings?.academicSession || "2025/2026";
        finalSemester = settings?.semester || "First Semester";
      }

      if ((!requestedSession && requestedSemester) || (requestedSession && !requestedSemester)) {
        return res.status(400).json({
          message: "Both academic session and semester are required together.",
        });
      }

      if (!supportedSemesters.includes(finalSemester)) {
        return res.status(400).json({
          message: "Unsupported semester. Use First Semester or Second Semester.",
        });
      }

      const settings = await Settings.findOne();
      const activeSession = settings?.academicSession || "2025/2026";
      const activeSemester = settings?.semester || "First Semester";

      if (finalSession !== activeSession || finalSemester !== activeSemester) {
        return res.status(403).json({
          message: "Historical school approval is not allowed. Use the active institutional cycle.",
        });
      }

      const submissionsToApprove = await Submission.find({
        "lecturerDetails.school": schoolName,
        "lecturerDetails.session": finalSession,
        "lecturerDetails.semester": finalSemester,
        status: "Pending Director",
      }).lean();

      if (!submissionsToApprove.length) {
        return res.status(200).json({
          message: "0 submissions approved successfully",
          approvedCount: 0,
        });
      }

      const approvalDate = new Date();
      const directorSignature = `Director Approval - ${approvalDate.toLocaleDateString()}`;
      const approvedSubmissions = [];

      for (const submission of submissionsToApprove) {
        const updatedSubmission = await Submission.findOneAndUpdate(
          {
            _id: submission._id,
            "lecturerDetails.school": schoolName,
            "lecturerDetails.session": finalSession,
            "lecturerDetails.semester": finalSemester,
            status: "Pending Director",
          },
          {
            $set: {
              status: "Approved",
              directorSignature,
              directorSignatureDate: approvalDate,
              approvalDate,
              lastModified: approvalDate,
            },
          },
          { returnDocument: 'after', runValidators: true }
        );

        if (updatedSubmission) {
          approvedSubmissions.push(updatedSubmission);
        }
      }

      for (const submission of approvedSubmissions) {
        await createNotification({
          recipientRole: "Lecturer",
          recipientPFNumber: submission.lecturerDetails?.pfNumber,
          title: "AOR Approved",
          message: "Your Assignment of Responsibility has been fully approved by the Director.",
          type: "success",
          link: "/tracking",
        });
      }

      res.status(200).json({
        message: `${approvedSubmissions.length} submissions approved successfully`,
        approvedCount: approvedSubmissions.length,
      });
    } catch (error) {
      console.error("School approval error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);
// --- UPDATE FORM STATUS (Pipeline Approvals & Rejections) ---
app.patch('/api/submissions/:id/status', verifyToken, async (req, res) => {
  try {
    const existingSubmission = await Submission.findById(req.params.id).lean();

    if (!existingSubmission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const role = req.user?.role;
    const nextStatus = String(req.body?.status || '').trim();
    const updateData = { lastModified: new Date() };
    const normalizeText = (value) => String(value ?? '').trim();
    const normalizeDepartment = (value) => normalizeText(value).toLowerCase();
    const normalizeSchool = (value) => normalizeText(value).toLowerCase();

    if (role === 'Lecturer') {
      return res.status(403).json({ message: 'Lecturers cannot approve or reject submissions through this route.' });
    }

    if (role === 'HOD') {
      const currentDepartment = normalizeDepartment(req.user?.department);
      const targetDepartment = normalizeDepartment(existingSubmission?.lecturerDetails?.department);
      const currentSchool = normalizeSchool(req.user?.school);
      const targetSchool = normalizeSchool(existingSubmission?.lecturerDetails?.school);

      if (existingSubmission.status !== 'Pending HOD') {
        return res.status(409).json({ message: 'Invalid prior status for HOD review.' });
      }

      if (currentDepartment !== targetDepartment) {
        return res.status(403).json({ message: 'You are not authorized to act on this department.' });
      }

      if (currentSchool && targetSchool && currentSchool !== targetSchool) {
        return res.status(403).json({ message: 'You are not authorized to act on this school.' });
      }

      if (nextStatus === 'Pending Dean') {
        const signature = normalizeText(req.body?.hodSignature);
        if (!signature) {
          return res.status(400).json({ message: 'HOD signature is required for approval.' });
        }

        Object.assign(updateData, {
          status: 'Pending Dean',
          hodSignature: signature,
          hodSignatureDate: req.body?.hodSignatureDate ? new Date(req.body.hodSignatureDate) : new Date(),
          approvalDate: req.body?.approvalDate ? new Date(req.body.approvalDate) : new Date(),
        });
      } else if (nextStatus === 'Rejected') {
        const reason = normalizeText(req.body?.rejectionReason);
        if (!reason) {
          return res.status(400).json({ message: 'A rejection reason is required.' });
        }

        Object.assign(updateData, {
          status: 'Rejected',
          rejectionReason: reason,
          rejectedBy: 'HOD',
        });
      } else {
        return res.status(409).json({ message: 'Invalid HOD transition.' });
      }

      const atomicFilter = {
        _id: existingSubmission._id,
        status: 'Pending HOD',
        'lecturerDetails.department': existingSubmission.lecturerDetails?.department,
      };

      if (currentSchool && targetSchool) {
        atomicFilter['lecturerDetails.school'] = existingSubmission.lecturerDetails?.school;
      }

      const updatedSubmission = await Submission.findOneAndUpdate(
        atomicFilter,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updatedSubmission) {
        return res.status(409).json({ message: 'Concurrent update detected. Submission status or scope changed.' });
      }

      if (updatedSubmission.status === 'Pending Dean') {
        await createNotification({
          recipientRole: 'Dean',
          recipientSchool: updatedSubmission.lecturerDetails.school,
          title: 'New Submission Awaiting Approval',
          message: `${updatedSubmission.lecturerDetails.firstName} ${updatedSubmission.lecturerDetails.lastName}'s AOR has been verified by the HOD and is awaiting your approval.`,
          type: 'info',
          link: '/dean',
        });
      }

      if (updatedSubmission.status === 'Rejected') {
        await createNotification({
          recipientPFNumber: updatedSubmission.lecturerDetails.pfNumber,
          recipientRole:'Lecturer',
          title: 'Submission Returned for Correction',
          message: `Your AOR form has been returned for correction. Reason: ${updatedSubmission.rejectionReason || 'No reason provided'}`,
          type: 'warning',
          link: '/track-submission',
        });
      }

      return res.json(updatedSubmission);
    } else if (role === 'Dean') {
      const currentSchool = normalizeSchool(req.user?.school);
      const targetSchool = normalizeSchool(existingSubmission?.lecturerDetails?.school);

      if (existingSubmission.status !== 'Pending Dean') {
        return res.status(409).json({ message: 'Invalid prior status for Dean review.' });
      }

      if (currentSchool !== targetSchool) {
        return res.status(403).json({ message: 'You are not authorized to act on this school.' });
      }

      if (nextStatus === 'Pending Director') {
        const signature = normalizeText(req.body?.deanSignature);
        if (!signature) {
          return res.status(400).json({ message: 'Dean signature is required for approval.' });
        }

        Object.assign(updateData, {
          status: 'Pending Director',
          deanSignature: signature,
          deanSignatureDate: req.body?.deanSignatureDate ? new Date(req.body.deanSignatureDate) : new Date(),
          approvalDate: req.body?.approvalDate ? new Date(req.body.approvalDate) : new Date(),
        });
      } else if (nextStatus === 'Rejected') {
        const reason = normalizeText(req.body?.rejectionReason);
        if (!reason) {
          return res.status(400).json({ message: 'A rejection reason is required.' });
        }

        Object.assign(updateData, {
          status: 'Rejected',
          rejectionReason: reason,
          rejectedBy: 'Dean',
        });
      } else {
        return res.status(409).json({ message: 'Invalid Dean transition.' });
      }

      const atomicFilter = {
        _id: existingSubmission._id,
        status: 'Pending Dean',
        'lecturerDetails.school': existingSubmission.lecturerDetails?.school,
      };

      const updatedSubmission = await Submission.findOneAndUpdate(
        atomicFilter,
        { $set: updateData },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updatedSubmission) {
        return res.status(409).json({ message: 'Concurrent update detected. Submission status or scope changed.' });
      }

      if (updatedSubmission.status === 'Pending Director') {
        await createNotification({
          recipientRole: 'Director',
          title: 'School Approval Awaiting Validation',
          message: `${updatedSubmission.lecturerDetails.school} has submitted an AOR awaiting Director validation.`,
          type: 'info',
          link: '/director',
        });
      }

      if (updatedSubmission.status === 'Rejected') {
        await createNotification({
          recipientPFNumber: updatedSubmission.lecturerDetails.pfNumber,
          recipientRole :'Lecturer',
          title: 'Submission Returned for Correction',
          message: `Your AOR form has been returned for correction. Reason: ${updatedSubmission.rejectionReason || 'No reason provided'}`,
          type: 'warning',
          link: '/track-submission',
        });
      }

      return res.json(updatedSubmission);
    } else {
      return res.status(403).json({ message: 'Unauthorized status update attempt.' });
    }
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error while updating status' });
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
            returnDocument: 'after',
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
          message: "sorry user has been assigned already or Not found",
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
    const cleanPF = normalizePfValue(pfNumber);

    let user = await User.findOne({ officialPfNumber: cleanPF });

    if (!user && cleanPF) {
      user = await User.findOne({ pfNumber: cleanPF });
    }

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
      message: "Password has been reset successfully. Login with password: 123",
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
          message: "this user has been assigned already",
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

      const rawPf = String(pfNumber ?? "").replace(/\D/g, "");
      const canonicalAdminPf =
      user.role === "Lecturer"
       ? normalizePfValue(pfNumber)
       : user.role === "Director"
       ? normalizePfValue(`D${rawPf}R`)
        : user.role === "HOD"
        ? normalizePfValue(`H${rawPf}`)
        : user.role === "Dean"
          ? normalizePfValue(`D${rawPf}`)
          : normalizePfValue(pfNumber);

      const officialPf = canonicalAdminPf;

      if (!officialPf) {
        return res.status(400).json({
          message: "Official PF Number is required.",
        });
      }

      const conflictUser = await findPfConflict({
        userId: user._id,
        pfValue: officialPf,
      });

      if (conflictUser) {
        return res.status(409).json({
          message: `This PF Number is already assigned to another user (${conflictUser.role}).`,
        });
      }

      const salt = await bcrypt.genSalt(10);

      user.name = name.trim(); 

      user.officialPfNumber = officialPf;
      user.password = await bcrypt.hash(
        newPassword,
        salt
      );
      user.firstLogin = false;

      await user.save();

      const activePfNumber = user.officialPfNumber || user.pfNumber;

      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          pfNumber: activePfNumber,
          officialPfNumber: user.officialPfNumber || null,
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
          pfNumber: activePfNumber,
          officialPfNumber: user.officialPfNumber || null,
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
      const rawPf = String(req.body.pfNumber || "").replace(/\D/g, "");
      const pfNumber =
      req.user.role === "Lecturer"
      ? normalizePfValue(req.body.pfNumber)
      : req.user.role === "HOD"
      ? normalizePfValue(`H${rawPf}`)
      : req.user.role === "Dean"
        ? normalizePfValue(`D${rawPf}`)
        : req.user.role === "Director"
          ? normalizePfValue(`D${rawPf}R`)
          : normalizePfValue(req.body.pfNumber);

      if (!name || !pfNumber) {
        return res.status(400).json({
          message: "Name and PF Number are required.",
        });
      }

      const currentUser = await User.findById(req.user.id);

      if (!currentUser) {
        return res.status(404).json({
          message: "Sorry but user was not Seen",
        });
      }

      const pfExists = await findPfConflict({
        userId: currentUser._id,
        pfValue: pfNumber,
      });

      if (pfExists) {
        return res.status(409).json({
          message: "This PF Number is already assigned to another user.",
        });
      }

      currentUser.name = name;
      currentUser.officialPfNumber = pfNumber;

      await currentUser.save();

      const activePfNumber = currentUser.officialPfNumber || currentUser.pfNumber;

      const token = jwt.sign(
        {
          id: currentUser._id,
          name: currentUser.name,
          pfNumber: activePfNumber,
          officialPfNumber: currentUser.officialPfNumber || null,
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
          pfNumber: activePfNumber,
          officialPfNumber: currentUser.officialPfNumber || null,
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
        message: 'Use a secure admin route.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    const existingAdminUsers = await User.find({
      role: { $in: ['Dean', 'HOD'] },
    }).select('pfNumber role school department').lean();

    const expectedUsers = [
      {
        name: 'Prof. S.M Dauda',
        pfNumber: 'D400R',
        role: 'Director',
        school: 'Office of the Director',
        department: '',
      }
    ];

    const deans = [
      { school: 'SICT', pfNumber: 'D300' },
      { school: 'SIPET', pfNumber: 'D301' },
      { school: 'SFAT', pfNumber: 'D302' },
      { school: 'SSTE', pfNumber: 'D303' },
      { school: 'SAMET', pfNumber: 'D304' },
      { school: 'SIT', pfNumber: 'D305' },
      { school: 'SLS', pfNumber: 'D306' },
      { school: 'SET', pfNumber: 'D307' },
      { school: 'SAHS', pfNumber: 'D308' },
      { school: 'SAFT', pfNumber: 'D309' },
      { school: 'SAT', pfNumber: 'D310' },
      { school: 'SEET', pfNumber: 'D311' },
      { school: 'SPS', pfNumber: 'D312' },
      { school: 'PGS', pfNumber: 'D313' },
      { school: 'SBMS', pfNumber: 'D314' },
      { school: 'SPhS', pfNumber: 'D315' },
    ];

    const getNumericPfValue = (pfNumber, prefix) => {
      if (!pfNumber) return 0;
      const match = String(pfNumber).trim().match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
      return match ? Number(match[1]) : 0;
    };

    const normalizeValue = (value) => String(value ?? '').trim().toLowerCase();

    let nextDeanNumber = Math.max(
      0,
      ...existingAdminUsers
        .filter((user) => user.role === 'Dean')
        .map((user) => getNumericPfValue(user.pfNumber, 'D'))
    );

    let nextHodNumber = Math.max(
      0,
      ...existingAdminUsers
        .filter((user) => user.role === 'HOD')
        .map((user) => getNumericPfValue(user.pfNumber, 'H'))
    );

    const existingAdminLookup = new Map(
      existingAdminUsers.map((user) => [
        `${normalizeValue(user.role)}|${normalizeValue(user.school)}|${normalizeValue(user.department)}`,
        user,
      ])
    );

    deans.forEach((dean) => {
      const lookupKey = `dean|${normalizeValue(dean.school)}|dean office`;
      const existingDean = existingAdminLookup.get(lookupKey);

      if (!existingDean) {
        nextDeanNumber += 1;
        expectedUsers.push({
          name: 'Dean of ' + dean.school,
          pfNumber: 'D' + String(nextDeanNumber),
          role: 'Dean',
          school: dean.school,
          department: 'Dean Office',
        });
      }
    });

    Object.entries(schoolDepartments).forEach(([school, departments]) => {
      departments.forEach((department) => {
        const lookupKey = `hod|${normalizeValue(school)}|${normalizeValue(department)}`;
        const existingHod = existingAdminLookup.get(lookupKey);

        if (!existingHod) {
          nextHodNumber += 1;
          expectedUsers.push({
            name: 'HOD ' + department,
            pfNumber: 'H' + String(nextHodNumber),
            role: 'HOD',
            school,
            department,
          });
        }
      });
    });

    let lecturerCounter = 1;
    let lecturerPF = '001';
    Object.entries(schoolDepartments).forEach(([school, departments]) => {
      departments.forEach((department) => {
        for (let i = 1; i <= 125; i++) {
          expectedUsers.push({
            name: 'Lecturer ' + lecturerCounter,
            pfNumber: String(lecturerPF).padStart(3, '0'),
            role: 'Lecturer',
            school,
            department,
          });
          lecturerCounter++;
          lecturerPF++;
        }
      });
    });

    const summary = {
      created: 0,
      updated: 0,
      protected: 0,
    };

    for (const userData of expectedUsers) {
      const existingUser = await User.findOne({ pfNumber: userData.pfNumber });

      if (existingUser) {
        if (existingUser.lastLoginAt) {
          summary.protected += 1;
          continue;
        }

        const updateData = {};

        if (!existingUser.name || existingUser.name.trim() === '') updateData.name = userData.name;
        if (!existingUser.role) updateData.role = userData.role;
        if (!existingUser.school && userData.school) updateData.school = userData.school;
        if (!existingUser.department && userData.department) updateData.department = userData.department;
        if (!existingUser.password || existingUser.password.trim() === '') updateData.password = hashedPassword;
        if (existingUser.firstLogin === undefined || existingUser.firstLogin === null) updateData.firstLogin = true;

        if (Object.keys(updateData).length > 0) {
          await User.updateOne({ _id: existingUser._id }, { $set: updateData });
          summary.updated += 1;
        } else {
          summary.protected += 1;
        }

        continue;
      }

      await User.create({
        ...userData,
        password: hashedPassword,
        firstLogin: true,
      });

      summary.created += 1;
    }

    res.json({
      message: '✅ User setup completed safely. Existing active users were preserved, missing users were added, and only never-logged-in accounts were updated.',
      created: summary.created,
      updated: summary.updated,
      protected: summary.protected,
      defaultPassword: '123',
    });
  } catch (error) {
    console.error(error);
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
