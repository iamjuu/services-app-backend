const { Message, Conversation } = require('../../models');

// @desc    Get messages for a conversation
// @route   GET /api/conversations/:id/messages
// @access  Private (Participant or Admin)
const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isParticipant =
      conversation.customerId.toString() === req.user._id.toString() ||
      conversation.professionalId.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages in this conversation' });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .populate('senderId', 'name profilePhoto role')
      .populate('receiverId', 'name profilePhoto role')
      .sort({ createdAt: 1 });

    // Mark unread messages sent to current user as read
    if (isParticipant) {
      const now = new Date();
      await Message.updateMany(
        {
          conversationId: conversation._id,
          receiverId: req.user._id,
          isRead: false
        },
        {
          isRead: true,
          isDelivered: true,
          status: 'READ',
          readAt: now
        }
      );

      messages.forEach((msg) => {
        if (
          (msg.receiverId?._id?.toString() === req.user._id.toString() ||
            msg.receiverId?.toString() === req.user._id.toString()) &&
          !msg.isRead
        ) {
          msg.isRead = true;
          msg.isDelivered = true;
          msg.status = 'READ';
          msg.readAt = now;
        }
      });

      // Reset unread count for current user
      if (req.user.role === 'CUSTOMER') {
        conversation.unreadCountCustomer = 0;
      } else if (req.user.role === 'PROFESSIONAL') {
        conversation.unreadCountProfessional = 0;
      }
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversationMessages
};
