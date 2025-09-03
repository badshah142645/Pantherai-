const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// POST /v1/chat/completions
router.post('/completions', async (req, res) => {
  const { model } = req.body;

  let apiUrl, apiKey, headers, requestData = req.body;

  // OpenAI models
  if (model.startsWith('gpt') || model.startsWith('text-') || model.startsWith('code-') || model.startsWith('dall-e')) {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
    apiKey = process.env.OPENAI_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Anthropic models
  else if (model.startsWith('claude')) {
    apiUrl = 'https://api.anthropic.com/v1/messages';
    apiKey = process.env.ANTHROPIC_API_KEY;
    headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    };
    // Transform OpenAI format to Anthropic format
    requestData = {
      model: model,
      max_tokens: req.body.max_tokens || 1024,
      messages: req.body.messages
    };
  }
  // Google models
  else if (model.startsWith('gemini') || model.startsWith('palm') || model.startsWith('bert') || model.startsWith('t5')) {
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
    headers = {
      'Content-Type': 'application/json'
    };
    // Transform to Google format
    requestData = {
      contents: [{
        parts: req.body.messages.map(msg => ({ text: msg.content }))
      }]
    };
  }
  // Meta models
  else if (model.startsWith('llama') || model.startsWith('codellama')) {
    apiUrl = 'https://api.meta.ai/v1/chat/completions';
    apiKey = process.env.META_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Cohere models
  else if (model.startsWith('command') || model.startsWith('base')) {
    apiUrl = 'https://api.cohere.ai/v1/chat';
    apiKey = process.env.COHERE_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Mistral models
  else if (model.startsWith('mistral') || model.startsWith('mixtral') || model.startsWith('codestral')) {
    apiUrl = 'https://api.mistral.ai/v1/chat/completions';
    apiKey = process.env.MISTRAL_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Qwen models
  else if (model.startsWith('qwen')) {
    apiUrl = 'https://api.qwen.ai/v1/chat/completions';
    apiKey = process.env.QWEN_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  // Other models
  else if (model.startsWith('deepseek') || model.startsWith('starcoder') || model.startsWith('phi') || model.startsWith('falcon') || model.startsWith('yi')) {
    // Route to appropriate provider based on model
    apiUrl = `https://api.${model.split('-')[0]}.ai/v1/chat/completions`;
    apiKey = process.env[`${model.split('-')[0].toUpperCase()}_API_KEY`];
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  else {
    return res.status(400).json({ error: 'Unsupported model' });
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