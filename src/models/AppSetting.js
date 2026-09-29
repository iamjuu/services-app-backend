const mongoose = require('mongoose');

/**
 * AppSetting — a single-document settings store for platform-wide config.
 * Uses a fixed key 'global' so there is always exactly one settings document.
 */
const AppSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global',
      unique: true,
    },
    registrationFeePaise: {
      type: Number,
      default: 1000, // ₹10 by default (1000 paise)
      min: 100,      // minimum ₹1
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppSetting', AppSettingSchema);
