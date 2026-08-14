const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  { name: { type: String, required: true, },

    pfNumber: {
      type: String,
      required: true,
      unique: true,
    },
    position: {
  type: String,
},
    role: {
      type: String,
      required: true,
      enum: [
        "Lecturer",
        "HOD",
        "Dean",
        "Director",
      ],
    },
    password: {
      type: String,
      required: true,
    },

    department: {
      type: String,
    },

    school: {
      type: String,
    },

    firstLogin: {
      type: Boolean,
      default: true,
    },

    // AI Mock HR Data
    dateOfBirth: {
      type: Date,
    },

    dateOfFirstAppointment: {
      type: Date,
    },

    isMockHRData: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);