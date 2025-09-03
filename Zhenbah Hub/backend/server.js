const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development/demo
    return process.env.NODE_ENV === 'development';
  }
});
app.use(limiter);

// Routes
app.use('/v1/chat', require('./routes/chat'));
app.use('/v1/images', require('./routes/images'));
app.use('/v1/audio', require('./routes/audio'));
app.use('/v1/embeddings', require('./routes/embeddings'));
app.use('/auth', require('./routes/auth'));
app.use('/keys', require('./routes/keys'));

// Models endpoint
app.get('/v1/models', (req, res) => {
  const models = require('./models.json');
  const allModels = [];

  Object.keys(models).forEach(category => {
    Object.keys(models[category]).forEach(provider => {
      models[category][provider].forEach(model => {
        allModels.push({
          id: model,
          object: 'model',
          created: Date.now(),
          owned_by: provider,
          category: category
        });
      });
    });
  });

  res.json({
    object: 'list',
    data: allModels
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Zhenbah Hub API is running' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;