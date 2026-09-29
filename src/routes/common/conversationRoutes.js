const express = require('express');
const router = express.Router();
const {
  getConversations,
  createOrGetConversation,
  getConversationById
} = require('../../controllers/common/conversationController');
const { getConversationMessages } = require('../../controllers/common/messageController');
const { protect } = require('../../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getConversations)
  .post(createOrGetConversation);

router.get('/:id', getConversationById);
router.get('/:id/messages', getConversationMessages);

module.exports = router;
