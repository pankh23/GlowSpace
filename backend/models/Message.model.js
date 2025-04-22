const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'guest'],
    default: 'user'
  },
  senderName: String,
  senderAvatar: String,
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['group', 'private'],
    default: 'group'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

messageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);