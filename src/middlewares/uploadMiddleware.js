const multer = require('multer');
const path = require('path');
const fs = require('fs');

const profilesDir = path.join(__dirname, '../../uploads/profiles');
const documentsDir = path.join(__dirname, '../../uploads/documents');

// Ensure directories exist
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Storage for public profile photos
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

// Storage for private identity verification documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// Combined storage for professional registration (handles profile photo + docs)
const combinedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      cb(null, profilesDir);
    } else {
      cb(null, documentsDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = file.fieldname === 'profilePhoto' ? 'profile' : `doc-${file.fieldname}`;
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|pdf/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type! Allowed formats: JPEG, JPG, PNG, WEBP, PDF (max 10MB)'));
  }
};

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

// Professional registration upload handler supporting:
// profilePhoto, aadhaar (required), and optional docs: pan, passport, driving_license, professional_certificate, other
const uploadProfessionalFiles = multer({
  storage: combinedStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'passport', maxCount: 1 },
  { name: 'drivingLicense', maxCount: 1 },
  { name: 'professionalCertificate', maxCount: 1 },
  { name: 'otherDoc', maxCount: 1 }
]);

module.exports = {
  uploadProfile,
  uploadDocuments,
  uploadProfessionalFiles
};
