const mongoose = require('mongoose');

const professionalDocumentSchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProfessionalProfile',
      required: true
    },
    documentType: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'PROFESSIONAL_CERTIFICATE', 'OTHER'],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    originalFileName: {
      type: String,
      default: ''
    },
    mimeType: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.models.ProfessionalDocument || mongoose.model('ProfessionalDocument', professionalDocumentSchema);
