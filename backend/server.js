const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const chatRoutes = require('./routes/chat.routes');
const emotionRoutes = require('./routes/emotion.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const videoRoutes = require('./routes/video.routes');
const counselorRoutes = require('./routes/counselor.routes');

// Config
const app = express();
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ['GET', 'POST']
  }
});

// Make io instance available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Add route logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/emotions', emotionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/counselors', counselorRoutes);

// Database connection
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB:', process.env.MONGODB_URI);
  // Start the server only after MongoDB connection is established
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- POST /api/appointments/book');
    console.log('- GET /api/appointments');
    console.log('- PUT /api/appointments/:id/status');
  });
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    // If no token is provided, create a guest user
    if (!token) {
      const guestId = `guest-${Date.now()}`;
      const guestName = `Guest-${guestId.substring(guestId.length - 4)}`;
      
      socket.userId = guestId;
      socket.user = {
        _id: guestId,
        username: guestName,
        profilePicture: `https://ui-avatars.com/api/?name=${guestName}&background=random`
      };
      console.log(`Guest user connected: ${guestName} (${guestId})`);
      return next();
    }
    
    // Handle JWT token for authenticated users
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await require('./models/User.model').findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.userId = user._id;
      socket.user = user;
      console.log(`Authenticated user connected: ${user.username} (${user._id})`);
      next();
    } catch (err) {
      console.error('JWT verification error:', err.message);
      // Instead of failing, create a guest user
      const guestId = `guest-${Date.now()}`;
      const guestName = `Guest-${guestId.substring(guestId.length - 4)}`;
      
      socket.userId = guestId;
      socket.user = {
        _id: guestId,
        username: guestName,
        profilePicture: `https://ui-avatars.com/api/?name=${guestName}&background=random`
      };
      console.log(`Guest user connected after JWT failure: ${guestName} (${guestId})`);
      next();
    }
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Authentication error: Server error'));
  }
});

// Active users, rooms map, and rate limiting
const activeUsers = new Map();
const chatRooms = new Map();
const messageTimestamps = new Map(); // For rate limiting
const typingUsers = new Map(); // For tracking typing status

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Add user to active users with additional info
  activeUsers.set(socket.userId, {
    id: socket.userId,
    socketId: socket.id,
    username: socket.user.username,
    profilePicture: socket.user.profilePicture,
    lastSeen: new Date(),
    status: 'online'
  });

  // Broadcast active users list
  io.emit('activeUsers', Array.from(activeUsers.values()));

  // Handle joining a chat room
  socket.on('joinRoom', async ({ username, room }) => {
    try {
      console.log(`User ${socket.userId} joining room: ${room}`);
      
      // Leave previous rooms if any
      for (const [roomId, members] of chatRooms.entries()) {
        if (members.has(socket.userId) && roomId !== room) {
          console.log(`User ${socket.userId} leaving room: ${roomId}`);
          members.delete(socket.userId);
          socket.leave(roomId);
          
          // Notify room members
          io.to(roomId).emit('userLeft', {
            userId: socket.userId,
            username: socket.user.username,
            timestamp: new Date()
          });
        }
      }
      
      // Join new room
      socket.join(room);
      if (!chatRooms.has(room)) {
        console.log(`Creating new room: ${room}`);
        chatRooms.set(room, new Set());
      }
      chatRooms.get(room).add(socket.userId);
      
      console.log(`Room ${room} now has members: ${[...chatRooms.get(room)]}`);
      
      // Get chat history
      const Message = require('./models/Message.model');
      const messages = await Message.find({ room })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean();

      // Send chat history and room info to the joining user
      socket.emit('chatHistory', {
        messages,
        participants: Array.from(chatRooms.get(room)).map(userId => {
          const user = activeUsers.get(userId);
          return {
            id: userId,
            username: user.username,
            profilePicture: user.profilePicture,
            status: user.status
          };
        })
      });
      
      // Notify room members
      io.to(room).emit('userJoined', {
        userId: socket.userId,
        username: socket.user.username,
        timestamp: new Date()
      });

      // Send room members list
      io.to(room).emit('updateParticipants', Array.from(chatRooms.get(room)).map(userId => {
        const user = activeUsers.get(userId);
        return {
          id: userId,
          username: user.username,
          profilePicture: user.profilePicture
        };
      }));
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle leaving a chat room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    if (chatRooms.has(roomId)) {
      chatRooms.get(roomId).delete(socket.userId);
      if (chatRooms.get(roomId).size === 0) {
        chatRooms.delete(roomId);
      }
    }

    // Notify room members
    io.to(roomId).emit('userLeft', {
      userId: socket.userId,
      roomId,
      timestamp: new Date()
    });
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { room, isTyping } = data;
    if (room && chatRooms.has(room)) {
      if (isTyping) {
        typingUsers.set(socket.userId, room);
      } else {
        typingUsers.delete(socket.userId);
      }
      
      const typingData = Array.from(typingUsers.entries())
        .filter(([_, roomId]) => roomId === room)
        .map(([userId]) => {
          const user = activeUsers.get(userId);
          return {
            userId,
            username: user.username
          };
        });

      io.to(room).emit('typingStatus', typingData);
    }
  });

  socket.on('stopTyping', (data) => {
    const { room } = data;
    if (typingUsers.has(room)) {
      typingUsers.delete(socket.userId);
      io.to(room).emit('userStoppedTyping', {
        userId: socket.userId
      });
    }
  });

  socket.on('groupMessage', async (data) => {
    try {
      const { room, content } = data;
      
      if (!room || !content) {
        throw new Error('Room and content are required');
      }

      if (!chatRooms.has(room)) {
        throw new Error('Room does not exist');
      }

      if (!chatRooms.get(room).has(socket.userId)) {
        throw new Error('User is not in this room');
      }

      const timestamp = Date.now();
      const userTimestamps = messageTimestamps.get(socket.userId) || [];
      
      const recentMessages = userTimestamps.filter(time => timestamp - time < 1000);
      if (recentMessages.length >= 5) {
        throw new Error('Message rate limit exceeded');
      }

      userTimestamps.push(timestamp);
      messageTimestamps.set(socket.userId, userTimestamps);

      const Message = require('./models/Message.model');
      const message = new Message({
        content,
        sender: socket.userId,
        senderType: socket.user._id.startsWith('guest-') ? 'guest' : 'user',
        senderName: socket.user.username,
        senderAvatar: socket.user.profilePicture,
        room,
        type: 'group'
      });

      await message.save();

      const messageData = {
        _id: message._id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          _id: socket.userId,
          username: socket.user.username,
          profilePicture: socket.user.profilePicture
        }
      };

      io.to(room).emit('groupMessage', messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('privateMessage', (data) => {
    const recipientSocket = Array.from(io.sockets.sockets.values())
      .find(s => s.userId === data.to);

    if (recipientSocket) {
      recipientSocket.emit('privateMessage', {
        ...data,
        from: socket.userId,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
    activeUsers.delete(socket.userId);
    io.emit('activeUsers', Array.from(activeUsers.values()));

    for (const [roomId, members] of chatRooms.entries()) {
      if (members.has(socket.userId)) {
        members.delete(socket.userId);
        io.to(roomId).emit('userLeft', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });
      }
    }

    typingUsers.delete(socket.userId);
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'GlowSpace API is running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error', 
      details: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      details: err.message 
    });
  }
  
  // Default error response
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ 
    error: message,
    status: status 
  });
});