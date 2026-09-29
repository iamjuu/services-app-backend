const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      default: 'Special Offer',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    ctaText: {
      type: String,
      default: 'Explore Now',
    },
    targetCategory: {
      type: String,
      default: 'All',
    },
    order: {
      type: Number,
      default: 0,
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

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
