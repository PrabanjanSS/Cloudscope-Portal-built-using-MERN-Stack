const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');
// Import your new Message blueprint
const Message = require('../models/Message'); 

// Token Authentication Middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains your user id as req.user.id
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 🆕 ROUTE 1: Fetch chat history for the logged-in user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    // Find all messages belonging to this user and sort them from oldest to newest
    const history = await Message.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(history);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ message: "Failed to retrieve conversation history" });
  }
});

// ROUTE 2: Send message and log everything to the DB
router.post('/', authMiddleware, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    // 1. Log the user's incoming message to MongoDB
    const userLog = new Message({
      userId: req.user.id,
      sender: 'user',
      text: message
    });
    await userLog.save();

    // 2. Fetch the response from Gemini 2.5 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const structuredPrompt = `System Persona: You are SkyBot, a witty weather assistant inside the CloudScope dashboard. Answer the user comprehensively.\n\nUser Question: ${message}`;
    
    const result = await model.generateContent(structuredPrompt);
    const response = await result.response;
    const text = response.text();

    // 3. Log the AI's generated response to MongoDB
    const botLog = new Message({
      userId: req.user.id,
      sender: 'bot',
      text: text
    });
    await botLog.save();

    // 4. Send the response back to React
    res.json({ reply: text });
  } catch (error) {
    console.error('--- CHATBOT SYSTEM ERROR ---', error.message);
    res.status(500).json({ message: 'Chatbot service encountered an error' });
  }
});

module.exports = router;