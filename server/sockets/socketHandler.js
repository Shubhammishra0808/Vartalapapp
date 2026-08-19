const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// In-memory mapping of active user socket sessions: userId -> Set(socketIds)
const activeUsers = new Map();
// Active calls tracking: callId -> callState
const activeCalls = new Map();

const initializeSockets = (io) => {
  // Socket JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_access_key_change_in_production_93817342948'
      );
      const user = await User.findById(decoded.id);

      if (!user || user.isSuspended) {
        return next(new Error('User account not found or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    // Register active user socket
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
      // Update database online status
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});
      io.emit('user:status', { userId, isOnline: true });
    }
    activeUsers.get(userId).add(socket.id);

    console.log(`[Socket] Connected: ${socket.user.username} (${socket.id})`);

    // Join conversation rooms
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Handle typing events
    socket.on('typing:start', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('typing:status', {
          conversationId,
          userId,
          name: socket.user.name,
          isTyping: true,
        });
      } else if (recipientId && activeUsers.has(recipientId)) {
        activeUsers.get(recipientId).forEach((sId) => {
          io.to(sId).emit('typing:status', {
            userId,
            name: socket.user.name,
            isTyping: true,
          });
        });
      }
    });

    socket.on('typing:stop', ({ conversationId, recipientId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).emit('typing:status', {
          conversationId,
          userId,
          isTyping: false,
        });
      } else if (recipientId && activeUsers.has(recipientId)) {
        activeUsers.get(recipientId).forEach((sId) => {
          io.to(sId).emit('typing:status', {
            userId,
            isTyping: false,
          });
        });
      }
    });

    // Real-time message dispatch
    socket.on('message:send', async (messageData, callback) => {
      try {
        const { conversationId } = messageData;
        // Broadcast to conversation room
        io.to(`conv_${conversationId}`).emit('message:new', messageData);

        // Also notify direct recipient sockets in case they haven't joined room yet
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          conversation.participants.forEach((p) => {
            const pId = p.user.toString();
            if (pId !== userId && activeUsers.has(pId)) {
              activeUsers.get(pId).forEach((sId) => {
                io.to(sId).emit('notification:message', {
                  conversationId,
                  message: messageData,
                  sender: {
                    _id: socket.user._id,
                    name: socket.user.name,
                    avatar: socket.user.avatar,
                  },
                });
              });
            }
          });
        }

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      } catch (err) {
        console.error('[Socket Message Error]', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Message delivered status
    socket.on('message:delivered', ({ messageId, conversationId, senderId }) => {
      if (activeUsers.has(senderId)) {
        activeUsers.get(senderId).forEach((sId) => {
          io.to(sId).emit('message:status_update', {
            messageId,
            conversationId,
            status: 'delivered',
            userId,
          });
        });
      }
    });

    // Message read status (Blue double ticks)
    socket.on('message:read', ({ messageIds, conversationId, senderId }) => {
      if (activeUsers.has(senderId)) {
        activeUsers.get(senderId).forEach((sId) => {
          io.to(sId).emit('message:read_receipt', {
            messageIds,
            conversationId,
            readBy: userId,
            readAt: new Date(),
          });
        });
      }
    });

    // Message reactions
    socket.on('message:react', ({ messageId, conversationId, emoji, reactions }) => {
      io.to(`conv_${conversationId}`).emit('message:reaction_update', {
        messageId,
        conversationId,
        emoji,
        userId,
        reactions,
      });
    });

    // WebRTC Calling Signaling Events
    socket.on('call:initiate', ({ recipientId, conversationId, type, offer, isGroupCall }) => {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      activeCalls.set(callId, {
        callId,
        callerId: userId,
        callerName: socket.user.name,
        callerAvatar: socket.user.avatar,
        recipientId,
        conversationId,
        type: type || 'voice',
        isGroupCall: !!isGroupCall,
        status: 'ringing',
        startedAt: Date.now(),
      });

      if (recipientId && activeUsers.has(recipientId)) {
        activeUsers.get(recipientId).forEach((sId) => {
          io.to(sId).emit('call:incoming', {
            callId,
            caller: {
              _id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar,
              username: socket.user.username,
            },
            conversationId,
            type: type || 'voice',
            offer,
            isGroupCall,
          });
        });
      }

      // Ack to caller with callId
      socket.emit('call:initiated', { callId });
    });

    socket.on('call:accept', ({ callId, answer, callerId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'connected';
      }

      if (callerId && activeUsers.has(callerId)) {
        activeUsers.get(callerId).forEach((sId) => {
          io.to(sId).emit('call:accepted', {
            callId,
            answer,
            acceptor: {
              _id: socket.user._id,
              name: socket.user.name,
              avatar: socket.user.avatar,
            },
          });
        });
      }
    });

    socket.on('call:reject', ({ callId, callerId, reason }) => {
      activeCalls.delete(callId);
      if (callerId && activeUsers.has(callerId)) {
        activeUsers.get(callerId).forEach((sId) => {
          io.to(sId).emit('call:rejected', {
            callId,
            reason: reason || 'Call declined',
          });
        });
      }
    });

    socket.on('call:ice_candidate', ({ callId, targetUserId, candidate }) => {
      if (targetUserId && activeUsers.has(targetUserId)) {
        activeUsers.get(targetUserId).forEach((sId) => {
          io.to(sId).emit('call:ice_candidate', {
            callId,
            senderId: userId,
            candidate,
          });
        });
      }
    });

    socket.on('call:end', ({ callId, targetUserId, duration }) => {
      activeCalls.delete(callId);
      if (targetUserId && activeUsers.has(targetUserId)) {
        activeUsers.get(targetUserId).forEach((sId) => {
          io.to(sId).emit('call:ended', {
            callId,
            duration,
          });
        });
      }
    });

    socket.on('call:media_toggle', ({ callId, targetUserId, mediaType, isMuted }) => {
      if (targetUserId && activeUsers.has(targetUserId)) {
        activeUsers.get(targetUserId).forEach((sId) => {
          io.to(sId).emit('call:media_toggle', {
            callId,
            userId,
            mediaType, // 'video' | 'audio' | 'screen'
            isMuted,
          });
        });
      }
    });

    // Story broadcast
    socket.on('story:published', (storyData) => {
      socket.broadcast.emit('story:new', storyData);
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.user.username} (${socket.id})`);
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen }).catch(() => {});
          io.emit('user:status', { userId, isOnline: false, lastSeen });
        }
      }
    });
  });
};

module.exports = { initializeSockets, activeUsers };
