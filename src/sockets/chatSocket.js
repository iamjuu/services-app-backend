const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ProfessionalProfile = require('../models/ProfessionalProfile');

// In-memory map of online users: userId -> Set of socketIds
const onlineUsers = new Map();

const initializeChatSocket = (io) => {
  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1] ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_skilled_service_jwt_key_2026');
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return next(new Error('User account inactive or not found'));
      }

      // If user is a professional, verify they are approved!
      if (user.role === 'PROFESSIONAL') {
        const profile = await ProfessionalProfile.findOne({ userId: user._id });
        if (!profile || profile.verificationStatus !== 'APPROVED' || !user.loginAllowed) {
          return next(new Error('Professional account is not approved to chat'));
        }
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();

    // Track user online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      io.emit('userOnline', { userId, role: socket.user.role });
    }
    onlineUsers.get(userId).add(socket.id);

    // Join user's personal room for direct notifications
    socket.join(`user:${userId}`);

    // Join specific conversation room: `conversation:<conversationId>`
    socket.on('joinConversation', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Validate membership or admin role
        const isParticipant =
          conversation.customerId.toString() === userId ||
          conversation.professionalId.toString() === userId ||
          socket.user.role === 'ADMIN';

        if (!isParticipant) {
          return socket.emit('error', { message: 'Unauthorized to join conversation' });
        }

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        // Mark unread messages as read in this room
        const now = new Date();
        await Message.updateMany(
          {
            conversationId,
            receiverId: socket.user._id,
            isRead: false
          },
          {
            isRead: true,
            isDelivered: true,
            status: 'READ',
            readAt: now
          }
        );

        // Reset unread count
        if (socket.user.role === 'CUSTOMER') {
          conversation.unreadCountCustomer = 0;
        } else if (socket.user.role === 'PROFESSIONAL') {
          conversation.unreadCountProfessional = 0;
        }
        await conversation.save();

        io.to(roomName).emit('messageRead', {
          conversationId,
          readerId: userId,
          readAt: now
        });
      } catch (err) {
        console.error('[Socket joinConversation Error]:', err.message);
      }
    });

    // Send Message Event
    socket.on('sendMessage', async ({ conversationId, message, messageType = 'TEXT' }) => {
      try {
        if (!conversationId || !message || !message.trim()) {
          return socket.emit('error', { message: 'Valid conversation ID and message text are required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Validate membership
        const isCustomer = conversation.customerId.toString() === userId;
        const isProfessional = conversation.professionalId.toString() === userId;

        if (!isCustomer && !isProfessional) {
          return socket.emit('error', { message: 'You are not a participant in this conversation' });
        }

        // Verify professional is still APPROVED
        const proProfile = await ProfessionalProfile.findOne({ userId: conversation.professionalId });
        if (!proProfile || proProfile.verificationStatus !== 'APPROVED' || !proProfile.isActive) {
          return socket.emit('error', { message: 'Communication disabled: Professional is not approved or inactive' });
        }

        const receiverId = isCustomer ? conversation.professionalId : conversation.customerId;
        const isReceiverOnline = onlineUsers.has(receiverId.toString());
        const now = new Date();

        // 1. Save message to MongoDB (MongoDB is source of truth!)
        const newMessage = await Message.create({
          conversationId: conversation._id,
          senderId: socket.user._id,
          receiverId,
          message: message.trim(),
          messageType,
          isDelivered: isReceiverOnline,
          deliveredAt: isReceiverOnline ? now : null,
          status: isReceiverOnline ? 'DELIVERED' : 'SENT',
          isRead: false
        });

        // 2. Update conversation last message & counters
        conversation.lastMessage = message.trim();
        conversation.lastMessageAt = now;
        if (isCustomer) {
          conversation.unreadCountProfessional = (conversation.unreadCountProfessional || 0) + 1;
        } else {
          conversation.unreadCountCustomer = (conversation.unreadCountCustomer || 0) + 1;
        }
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'name profilePhoto role')
          .populate('receiverId', 'name profilePhoto role');

        const roomName = `conversation:${conversationId}`;

        // 3. Emit message to conversation room
        io.to(roomName).emit('receiveMessage', populatedMessage);

        // Also notify receiver's personal room for conversation preview update
        io.to(`user:${receiverId.toString()}`).emit('conversationUpdated', {
          conversationId: conversation._id,
          lastMessage: message.trim(),
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: isCustomer ? conversation.unreadCountProfessional : conversation.unreadCountCustomer
        });
      } catch (err) {
        console.error('[Socket sendMessage Error]:', err.message);
        socket.emit('error', { message: 'Failed to send message: ' + err.message });
      }
    });

    // Mark message read event
    socket.on('messageRead', async ({ conversationId, messageId }) => {
      try {
        if (!conversationId) return;

        const now = new Date();
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, {
            isRead: true,
            isDelivered: true,
            status: 'READ',
            readAt: now
          });
        } else {
          await Message.updateMany(
            {
              conversationId,
              receiverId: socket.user._id,
              isRead: false
            },
            {
              isRead: true,
              isDelivered: true,
              status: 'READ',
              readAt: now
            }
          );
        }

        const roomName = `conversation:${conversationId}`;
        io.to(roomName).emit('messageRead', {
          conversationId,
          readerId: userId,
          messageId,
          readAt: now
        });
      } catch (err) {
        console.error('[Socket messageRead Error]:', err.message);
      }
    });

    // Typing Indicator
    socket.on('typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('typing', {
        conversationId,
        userId,
        userName: socket.user.name
      });
    });

    // Stop Typing Indicator
    socket.on('stopTyping', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('stopTyping', {
        conversationId,
        userId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('userOffline', { userId });
        }
      }
    });
  });
};

module.exports = {
  initializeChatSocket,
  onlineUsers
};
