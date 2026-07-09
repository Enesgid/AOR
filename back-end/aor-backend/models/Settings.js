const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
      default: "2025/2026",
    },

    semester: {
      type: String,
      enum: ["First Semester", "Second Semester"],
      default: "First Semester",
    },

    submissionDeadline: Date,

    approvalDeadline: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Settings",
  settingsSchema
);