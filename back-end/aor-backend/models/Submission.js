const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  lecturerDetails: { type: Object, required: true },
  teaching: { type: Array }, 
  administrativeDuties: { type: Array },
  research: { type: Array },
  communityService: { type: Array },
  
status: {
    type: String,
    default: 'Pending HOD', 
    enum: ['Pending HOD', 'Pending Dean', 'Pending Director', 'Approved', 'Rejected'] 
  },
  rejectionReason: { type: String }, 
  rejectedBy: { type: String }, // Will save as 'HOD', 'Dean', or 'Director'
  
  // Tracking Signatures for all 3 levels
  hodSignature: { type: String }, 
  deanSignature: { type: String },
  directorSignature: { type: String },
  
  approvalDate: { type: Date },
  submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);