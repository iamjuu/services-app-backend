const { Conversation, Message, ProfessionalProfile } = require('../../models');

// @desc    Get user conversations (Customer / Professional / Admin moderation)
// @route   GET /api/conversations
// @access  Private
const getConversations = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'PROFESSIONAL') {
      filter.professionalId = req.user._id;
    } else if (req.user.role === 'ADMIN') {
      // Admin can view all conversations for monitoring & moderation
      filter = {};
    }

    const conversations = await Conversation.find(filter)
      .populate('customerId', 'name email phone profilePhoto location')
      .populate('professionalId', 'name email phone profilePhoto location')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    // Also populate professional's category and profile for rich UI
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const proProfile = await ProfessionalProfile.findOne({ userId: conv.professionalId?._id })
          .populate('categoryId', 'name icon');
        
        const [messageCount, latestMsg] = await Promise.all([
          Message.countDocuments({ conversationId: conv._id }),
          Message.findOne({ conversationId: conv._id }).sort({ createdAt: -1 })
        ]);

        return {
          ...conv.toObject(),
          messageCount,
          lastMessageDetails: latestMsg
            ? {
                senderId: latestMsg.senderId,
                isRead: latestMsg.isRead,
                isDelivered: latestMsg.isDelivered,
                status: latestMsg.status || (latestMsg.isRead ? 'READ' : 'SENT')
              }
            : null,
          professionalProfile: proProfile
            ? {
                category: proProfile.categoryId?.name,
                categoryIcon: proProfile.categoryId?.icon,
                experience: proProfile.experience,
                verificationStatus: proProfile.verificationStatus
              }
            : null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: populated.length,
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get or create conversation between customer and approved professional
// @route   POST /api/conversations
// @access  Private (Customer or Professional)
const createOrGetConversation = async (req, res, next) => {
  try {
    let { professionalUserId } = req.body;

    if (!professionalUserId) {
      return res.status(400).json({ success: false, message: 'Professional user ID is required' });
    }

    if (typeof professionalUserId === 'object' && professionalUserId._id) {
      professionalUserId = professionalUserId._id;
    }

    let customerId, professionalId;

    if (req.user.role === 'CUSTOMER') {
      customerId = req.user._id;
      professionalId = professionalUserId;
    } else if (req.user.role === 'PROFESSIONAL') {
      // Professional starting or opening conversation with a customer
      customerId = professionalUserId;
      professionalId = req.user._id;
    } else {
      return res.status(403).json({ success: false, message: 'Admins cannot create conversations.' });
    }

    // Verify Professional is APPROVED and active!
    const proProfile = await ProfessionalProfile.findOne({ userId: professionalId });
    if (!proProfile || proProfile.verificationStatus !== 'APPROVED' || !proProfile.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation: Professional is not approved or inactive.'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      customerId,
      professionalId
    })
      .populate('customerId', 'name email phone profilePhoto location')
      .populate('professionalId', 'name email phone profilePhoto location');

    if (!conversation) {
      conversation = await Conversation.create({
        customerId,
        professionalId,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('customerId', 'name email phone profilePhoto location')
        .populate('professionalId', 'name email phone profilePhoto location');
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single conversation detail
// @route   GET /api/conversations/:id
// @access  Private
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('customerId', 'name email phone profilePhoto location')
      .populate('professionalId', 'name email phone profilePhoto location');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check authorization: must be participant or Admin
    const isParticipant =
      conversation.customerId._id.toString() === req.user._id.toString() ||
      conversation.professionalId._id.toString() === req.user._id.toString();

    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const proProfile = await ProfessionalProfile.findOne({ userId: conversation.professionalId._id })
      .populate('categoryId', 'name icon');

    res.status(200).json({
      success: true,
      data: {
        ...conversation.toObject(),
        professionalProfile: proProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createOrGetConversation,
  getConversationById
};
