const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// POST /v1/audio/transcriptions
router.post('/transcriptions', async (req, res) => {
  const { model, file, language } = req.body;

  let apiUrl, apiKey, headers;

  if (model.startsWith('whisper')) {
    apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    apiKey = process.env.OPENAI_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data'
    };
  } else if (model.startsWith('google')) {
    apiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`;
    headers = {
      'Content-Type': 'application/json'
    };
  } else {
    return res.status(400).json({ error: 'Unsupported transcription model' });
  }

  try {
    const response = await axios.post(apiUrl, req.body, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// POST /v1/audio/translations
router.post('/translations', async (req, res) => {
  const { model, file } = req.body;

  if (model.startsWith('whisper')) {
    const apiUrl = 'https://api.openai.com/v1/audio/translations';
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
    res.status(400).json({ error: 'Audio translation not supported for this model' });
  }
});

// POST /v1/audio/speech
router.post('/speech', async (req, res) => {
  const { model, input, voice = 'alloy' } = req.body;

  let apiUrl, apiKey, headers, requestData;

  if (model.startsWith('tts')) {
    apiUrl = 'https://api.openai.com/v1/audio/speech';
    apiKey = process.env.OPENAI_API_KEY;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
    requestData = { model, input, voice };
  } else if (model.startsWith('eleven')) {
    apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM';
    apiKey = process.env.ELEVENLABS_API_KEY;
    headers = {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    };
    requestData = {
      text: input,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };
  } else if (model.startsWith('google')) {
    apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`;
    headers = {
      'Content-Type': 'application/json'
    };
    requestData = {
      input: { text: input },
      voice: { languageCode: 'en-US', name: voice },
      audioConfig: { audioEncoding: 'MP3' }
    };
  } else {
    return res.status(400).json({ error: 'Unsupported TTS model' });
  }

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

module.exports = router;