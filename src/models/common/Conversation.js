const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastMessage: {
      type: String,
      default: ''
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    unreadCountCustomer: {
      type: Number,
      default: 0
    },
    unreadCountProfessional: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ customerId: 1, professionalId: 1 }, { unique: true });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
