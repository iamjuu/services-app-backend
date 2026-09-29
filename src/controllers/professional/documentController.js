const path = require('path');
const fs = require('fs');
const { ProfessionalDocument } = require('../../models');

// @desc    Securely view/download private verification document (Aadhaar, PAN, etc.)
// @route   GET /api/documents/:id
// @access  Private (Admin Only)
const getDocumentFile = async (req, res, next) => {
  try {
    const doc = await ProfessionalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document record not found' });
    }

    const filePath = path.join(__dirname, '../../../uploads/documents', doc.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found on disk' });
    }

    // Set appropriate content type and stream safely
    if (doc.mimeType) {
      res.setHeader('Content-Type', doc.mimeType);
    }
    res.setHeader('Content-Disposition', `inline; filename="${doc.originalFileName || path.basename(filePath)}"`);

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocumentFile
};
