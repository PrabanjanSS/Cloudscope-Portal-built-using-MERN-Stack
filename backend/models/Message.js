const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // This connects the message to a specific user's ID from your users collection
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Tells us who wrote it: 'user' or 'bot'
  sender: { 
    type: String, 
    enum: ['user', 'bot'], 
    required: true 
  },
  // The actual text payload
  text: { 
    type: String, 
    required: true 
  },
  // Automatically timestamps the conversation log
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Message', MessageSchema);