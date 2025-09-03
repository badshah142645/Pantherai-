const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true, unique: true },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('APIKey', apiKeySchema);