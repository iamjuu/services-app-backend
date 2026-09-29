const mongoose = require('mongoose');

const professionalProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
      }
    ],
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'City/Location is required'],
      trim: true
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative']
    },
    skills: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    workHistory: [
      {
        jobTitle: {
          type: String,
          required: true,
          trim: true
        },
        customerName: {
          type: String,
          default: 'Verified Customer',
          trim: true
        },
        category: {
          type: String,
          default: 'Service'
        },
        completedDate: {
          type: Date,
          default: Date.now
        },
        amount: {
          type: String,
          default: '₹1,500'
        },
        location: {
          type: String,
          default: 'Kerala'
        },
        rating: {
          type: Number,
          default: 5,
          min: 1,
          max: 5
        },
        feedback: {
          type: String,
          default: 'Excellent craftsmanship and punctual service.'
        },
        status: {
          type: String,
          enum: ['COMPLETED', 'IN_PROGRESS', 'SCHEDULED'],
          default: 'COMPLETED'
        }
      }
    ],
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.ProfessionalProfile || mongoose.model('ProfessionalProfile', professionalProfileSchema);
