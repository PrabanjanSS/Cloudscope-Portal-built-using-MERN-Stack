const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const PeerMessage = require('../models/PeerMessage');

// Auth Checkpoint Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// 1. Search for users to add by email
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user.id) return res.status(400).json({ message: "You cannot add yourself" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Send a friend request
router.post('/request', authMiddleware, async (req, res) => {
  const { recipientId } = req.body;
  try {
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });
    if (existing) return res.status(400).json({ message: 'Friendship or request already exists' });

    const newRequest = new Friendship({ requester: req.user.id, recipient: recipientId, status: 'pending' });
    await newRequest.save();
    res.json({ message: 'Friend request sent successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Get my pending requests and current friends list
router.get('/friends-data', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }]
    }).populate('requester recipient', 'username email');

    let friends = [];
    let pendingRequests = [];

    friendships.forEach(f => {
      const isRequester = f.requester._id.toString() === req.user.id;
      const targetUser = isRequester ? f.recipient : f.requester;

      if (f.status === 'accepted') {
        friends.push({ friendshipId: f._id, ...targetUser._doc });
      } else if (f.status === 'pending' && !isRequester) {
        pendingRequests.push({ friendshipId: f._id, ...targetUser._doc });
      }
    });

    res.json({ friends, pendingRequests });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Accept or Reject a friend request
router.put('/respond', authMiddleware, async (req, res) => {
  const { friendshipId, status } = req.body; // status: 'accepted' or 'rejected'
  try {
    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) return res.status(404).json({ message: 'Request not found' });
    
    if (status === 'rejected') {
      await Friendship.findByIdAndDelete(friendshipId);
      return res.json({ message: 'Request declined' });
    }

    friendship.status = 'accepted';
    await friendship.save();
    res.json({ message: 'Friend request accepted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 5. Fetch private message logs (Only if accepted friends)
router.get('/messages/:friendId', authMiddleware, async (req, res) => {
  const { friendId } = req.params;
  try {
    const verified = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: req.user.id, recipient: friendId },
        { requester: friendId, recipient: req.user.id }
      ]
    });
    if (!verified) return res.status(403).json({ message: 'You must be friends to view messages.' });

    const logs = await PeerMessage.find({
      $or: [
        { sender: req.user.id, recipient: friendId },
        { sender: friendId, recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. Send private message
router.post('/message', authMiddleware, async (req, res) => {
  const { recipientId, text } = req.body;
  try {
    const verified = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: req.user.id, recipient: recipientId },
        { requester: recipientId, recipient: req.user.id }
      ]
    });
    if (!verified) return res.status(403).json({ message: 'You can only message confirmed friends.' });

    const msg = new PeerMessage({ sender: req.user.id, recipient: recipientId, text });
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;