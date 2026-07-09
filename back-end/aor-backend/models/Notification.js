const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
{
    recipientRole: {
        type: String,
        required: true,
    },

    recipientDepartment: String,

    recipientSchool: String,

    recipientPFNumber: String,

    title: String,

    message: String,

    type: {
        type: String,
        default: "info",
    },

    read: {
        type: Boolean,
        default: false,
    },

    link: String,
},
{ timestamps: true }
);

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);