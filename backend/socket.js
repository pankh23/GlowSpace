const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const Message = require('./models/Message.model');
const jwt = require('jsonwebtoken');


const users = new Map(); 
const roomParticipants = new Map(); 

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', async ({ username, room }) => {
      try {
        console.log('User joining room:', { username, room, socketId: socket.id });
        
        const userId = uuidv4();
        
        users.set(socket.id, { username, room, id: userId });
        
        socket.join(room);
        
        
        if (!roomParticipants.has(room)) {
          roomParticipants.set(room, new Set());
        }
        
        
        roomParticipants.get(room).add(socket.id);
        
        
        const chatHistory = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        console.log('Found chat history:', chatHistory.length, 'messages');
        
        
        const participants = Array.from(roomParticipants.get(room)).map(socketId => {
          const user = users.get(socketId);
          return {
            id: user.id,
            username: user.username,
            socketId: socketId
          };
        });
        
        console.log('Current participants:', participants);
        
        
        socket.emit('chatHistory', {
          messages: chatHistory.reverse(),
          participants
        });
        
        
        io.to(room).emit('updateParticipants', participants);
        
        
        socket.to(room).emit('userJoined', {
          username,
          userId,
          timestamp: new Date()
        });

        
        socket.emit('roomJoined', {
          room,
          userId,
          participants
        });
      } catch (error) {
        console.error('Error in joinRoom:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('chatMessage', async ({ room, message }) => {
      try {
        console.log('Received chat message:', { room, message, socketId: socket.id });
        
        const sender = users.get(socket.id);
        if (!sender) {
          console.error('Sender not found for socket:', socket.id);
          return;
        }

        // Create and save message to MongoDB
        const newMessage = new Message({
          room,
          senderId: sender.id,
          username: sender.username,
          message,
          timestamp: new Date()
        });

        await newMessage.save();
        console.log('Message saved to database:', newMessage);

        const messageObj = {
          _id: newMessage._id,
          room,
          senderId: sender.id,
          username: sender.username,
          message,
          timestamp: newMessage.timestamp,
          isSentByMe: false
        };

        console.log('Broadcasting message to room:', room);
        io.to(room).emit('chatMessage', messageObj);

        console.log('Sending confirmation to sender');
        socket.emit('messageSent', {
          ...messageObj,
          isSentByMe: true
        });
      } catch (error) {
        console.error('Error in chatMessage:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('privateMessage', ({ to, message }) => {
      try {
        const sender = users.get(socket.id);
        if (!sender) {
          console.error('Sender not found for socket:', socket.id);
          return;
        }

        const privateMessage = {
          from: sender.id,
          message,
          timestamp: new Date()
        };

        const targetSocket = Array.from(users.entries())
          .find(([_, user]) => user.id === to)?.[0];

        if (targetSocket) {
          io.to(targetSocket).emit('privateMessage', privateMessage);
        } else {
          console.error('Target user not found:', to);
        }
      } catch (error) {
        console.error('Error in privateMessage:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('typing', ({ room }) => {
      try {
        const sender = users.get(socket.id);
        if (!sender) return;

        socket.to(room).emit('userTyping', {
          userId: sender.id,
          username: sender.username,
          room
        });
      } catch (error) {
        console.error('Error in typing:', error);
      }
    });

    socket.on('stopTyping', ({ room }) => {
      try {
        const sender = users.get(socket.id);
        if (!sender) return;

        socket.to(room).emit('userStoppedTyping', {
          userId: sender.id,
          room
        });
      } catch (error) {
        console.error('Error in stopTyping:', error);
      }
    });

    socket.on('disconnect', () => {
      try {
        console.log('Client disconnected:', socket.id);
        const user = users.get(socket.id);
        if (user) {
          const { room } = user;
          
          if (roomParticipants.has(room)) {
            roomParticipants.get(room).delete(socket.id);
            
            const participants = Array.from(roomParticipants.get(room)).map(socketId => {
              const user = users.get(socketId);
              return {
                id: user.id,
                username: user.username,
                socketId: socketId
              };
            });
            
            io.to(room).emit('updateParticipants', participants);
          }
          
          users.delete(socket.id);
          
          socket.to(room).emit('userLeft', {
            username: user.username,
            userId: user.id,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
  });

  return io;
};

module.exports = initializeSocket; 