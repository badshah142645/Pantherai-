const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const APIKey = require('../models/APIKey');
const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

router.use(verifyToken);

// Get user's API keys
router.get('/', async (req, res) => {
  try {
    const keys = await APIKey.find({ user: req.userId });
    res.json(keys);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new API key
router.post('/', async (req, res) => {
  const { name } = req.body;
  const key = 'sk-' + Math.random().toString(36).substr(2, 16);
  try {
    const apiKey = new APIKey({ user: req.userId, key, name });
    await apiKey.save();
    res.json(apiKey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete API key
router.delete('/:id', async (req, res) => {
  try {
    await APIKey.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Key deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;