const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    professionalProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    notes: {
      type: String,
      default: ''
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);
