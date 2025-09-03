const APIKey = require('../models/APIKey');

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = authHeader.split(' ')[1];

  try {
    const apiKey = await APIKey.findOne({ key });
    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.user = apiKey.user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = auth;