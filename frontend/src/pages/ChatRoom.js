import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [userId, setUserId] = useState('');
  const socketRef = useRef();
  const messagesEndRef = useRef();

  useEffect(() => {
    // If no roomId is provided, redirect to the global chat room
    if (!roomId) {
      navigate('/chat/global');
      return;
    }

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username') || 'Guest';
    
    // Initialize socket connection
    socketRef.current = io('http://localhost:5001', {
      auth: {
        token: token || null
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      // Set the userId from the socket connection
      setUserId(socketRef.current.id);
      socketRef.current.emit('joinRoom', { username, room: roomId });
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketRef.current.on('chatHistory', ({ messages, participants }) => {
      console.log('Received chat history:', messages);
      setMessages(messages);
      setParticipants(participants);
      scrollToBottom();
    });

    socketRef.current.on('groupMessage', (message) => {
      console.log('Received new message:', message);
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketRef.current.on('updateParticipants', (updatedParticipants) => {
      console.log('Updated participants:', updatedParticipants);
      setParticipants(updatedParticipants);
    });

    socketRef.current.on('userJoined', (data) => {
      console.log('User joined:', data);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${data.username} joined the room`,
        timestamp: new Date()
      }]);
    });

    socketRef.current.on('userLeft', (data) => {
      console.log('User left:', data);
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${data.username} left the room`,
        timestamp: new Date()
      }]);
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !roomId) return;

    const tempId = uuidv4();
    console.log('Sending message:', { room: roomId, content: message.trim(), tempId });
    socketRef.current.emit('groupMessage', {
      room: roomId,
      content: message.trim(),
      tempId
    });

    setMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Participants ({participants.length})</h2>
        <div className="space-y-2">
          {participants.map(participant => (
            <div key={participant.id} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{participant.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={msg._id || index}
              className={`mb-4 ${
                msg.type === 'system'
                  ? 'text-center text-gray-500'
                  : msg.sender._id === userId
                    ? 'flex justify-end'
                    : 'flex justify-start'
              }`}
            >
              {msg.type !== 'system' && (
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender._id === userId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="font-semibold">{msg.sender.username}</div>
                  <div>{msg.content}</div>
                  <div className="text-xs mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              )}
              {msg.type === 'system' && (
                <div className="text-sm text-gray-500">{msg.content}</div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
