const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Message = require('../models/Message.model');
const User = require('../models/User.model');

// Optional auth middleware - allows both authenticated and guest users
const optionalAuth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - treat as guest
      req.isGuest = true;
      return next();
    }

    // Try to authenticate with token
    const token = authHeader.split(' ')[1];
    if (!token) {
      req.isGuest = true;
      return next();
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        req.isGuest = true;
        return next();
      }
      
      req.user = user;
      req.isGuest = false;
      next();
    } catch (error) {
      // Invalid token - treat as guest
      req.isGuest = true;
      next();
    }
  } catch (error) {
    req.isGuest = true;
    next();
  }
};

// Get active users
router.get('/active-users', optionalAuth, (req, res) => {
  const io = req.app.get('io');
  if (!io) {
    return res.status(500).json({ message: 'Socket.io not initialized' });
  }

  const activeUsers = Array.from(io.sockets.sockets.values())
    .map(socket => ({
      id: socket.userId,
      username: socket.user.username,
      profilePicture: socket.user.profilePicture,
      status: 'online',
      lastSeen: new Date()
    }));

  res.json(activeUsers);
});

// Get messages for a specific room - allow guest access with empty results
router.get('/room/:roomId', optionalAuth, async (req, res, next) => {
  try {
    const messages = await Message.find({
      room: req.params.roomId,
      type: 'group'
    }).sort({ createdAt: 1 });
    
    // Transform the messages for response
    const processedMessages = messages.map(msg => {
      // For regular users, populate from the User model
      if (msg.senderType !== 'guest' && typeof msg.sender === 'object') {
        return {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: {
            _id: msg.sender._id || msg.sender,
            username: msg.sender.username,
            profilePicture: msg.sender.profilePicture
          }
        };
      } 
      // For guest users, use the directly stored values
      else {
        return {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: {
            _id: msg.sender,
            username: msg.senderName || 'Guest',
            profilePicture: msg.senderAvatar || 'https://ui-avatars.com/api/?name=Guest&background=random'
          }
        };
      }
    });
    
    res.json(processedMessages);
  } catch (err) {
    console.error('Error fetching room messages:', err);
    next(err);
  }
});

// Get private messages between two users
router.get('/private/:userId', protect, async (req, res, next) => {
  try {
    const messages = await Message.find({
      type: 'private',
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    })
    .populate('sender', 'username profilePicture')
    .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Mark messages as read
router.put('/read/:messageId', protect, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.readBy.includes(req.user.id)) {
      message.readBy.push(req.user.id);
      await message.save();
    }

    res.json(message);
  } catch (err) {
    next(err);
  }
});

module.exports = router;