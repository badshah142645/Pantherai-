const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// POST /v1/embeddings
router.post('/', async (req, res) => {
  const { model, input, encoding_format = 'float' } = req.body;

  let apiUrl, apiKey, headers, requestData = req.body;

  // OpenAI embeddings
  if (model.startsWith('text-embedding')) {
    apiUrl = 'https://api.openai.com/v1/embeddings';
    apiKey = process.env.OPENAI_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Cohere embeddings
  else if (model.startsWith('embed-')) {
    apiUrl = 'https://api.cohere.ai/v1/embed';
    apiKey = process.env.COHERE_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Google embeddings
  else if (model.startsWith('text-embedding-004')) {
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${process.env.GOOGLE_API_KEY}`;
    headers = {
      'Content-Type': 'application/json'
    };
    requestData = {
      content: { parts: [{ text: input }] }
    };
  }
  // Sentence Transformers (via Hugging Face)
  else if (model.startsWith('sentence-transformers') || model.startsWith('e5-')) {
    apiUrl = `https://api-inference.huggingface.co/models/${model}`;
    headers = {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    };
    requestData = { inputs: input };
  }
  else {
    return res.status(400).json({ error: 'Unsupported embedding model' });
  }

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

module.exports = router;