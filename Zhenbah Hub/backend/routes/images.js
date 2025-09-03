const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// POST /v1/images/generations
router.post('/generations', async (req, res) => {
  const { model, prompt, size = '1024x1024', n = 1 } = req.body;

  let apiUrl, apiKey, headers, requestData;

  // OpenAI DALL-E
  if (model.startsWith('dall-e')) {
    apiUrl = 'https://api.openai.com/v1/images/generations';
    apiKey = process.env.OPENAI_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = { model, prompt, size, n };
  }
  // Stability AI
  else if (model.startsWith('stable-diffusion')) {
    apiUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
    apiKey = process.env.STABILITY_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = {
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: n,
      steps: 20
    };
  }
  // Midjourney
  else if (model.startsWith('midjourney')) {
    apiUrl = 'https://api.midjourney.com/v1/imagine';
    apiKey = process.env.MIDJOURNEY_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = { prompt };
  }
  // Google Imagen
  else if (model.startsWith('imagen')) {
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GOOGLE_API_KEY}`;
    headers = {
      'Content-Type': 'application/json'
    };
    requestData = { prompt };
  }
  // Flux
  else if (model.startsWith('flux')) {
    apiUrl = 'https://api.flux.ai/v1/images/generations';
    apiKey = process.env.FLUX_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = { prompt, size };
  }
  // Kandinsky
  else if (model.startsWith('kandinsky')) {
    apiUrl = 'https://api.kandinsky.ai/v1/images/generations';
    apiKey = process.env.KANDINSKY_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = { prompt };
  }
  else {
    return res.status(400).json({ error: 'Unsupported image model' });
  }

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// POST /v1/images/edits
router.post('/edits', async (req, res) => {
  const { model, image, mask, prompt } = req.body;

  if (model.startsWith('dall-e')) {
    const apiUrl = 'https://api.openai.com/v1/images/edits';
    const apiKey = process.env.OPENAI_API_KEY;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data'
    };

    try {
      const response = await axios.post(apiUrl, req.body, { headers });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.response?.data || error.message });
    }
  } else {
    res.status(400).json({ error: 'Image editing not supported for this model' });
  }
});

// POST /v1/images/variations
router.post('/variations', async (req, res) => {
  const { model, image, n = 1 } = req.body;

  if (model.startsWith('dall-e')) {
    const apiUrl = 'https://api.openai.com/v1/images/variations';
    const apiKey = process.env.OPENAI_API_KEY;
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data'
    };

    try {
      const response = await axios.post(apiUrl, req.body, { headers });
      res.json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.response?.data || error.message });
    }
  } else {
    res.status(400).json({ error: 'Image variations not supported for this model' });
  }
});

module.exports = router;