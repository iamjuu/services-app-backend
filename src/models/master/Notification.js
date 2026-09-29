const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Notification description is required'],
      trim: true,
      maxlength: 500,
    },
    icon: {
      type: String,
      default: 'notifications', // 'notifications', 'pricetag', 'construct', 'shield-checkmark', 'sparkles', 'megaphone', 'gift'
    },
    type: {
      type: String,
      enum: ['announcement', 'promo', 'alert', 'update'],
      default: 'announcement',
    },
    targetRole: {
      type: String,
      enum: ['all', 'customer', 'professional'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
