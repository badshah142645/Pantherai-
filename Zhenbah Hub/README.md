# Zhenbah Hub

A complete and exact clone of OpenRouter, replicating all its features, functionalities, interfaces, and behaviors identically.

## Features

- **API Routing & Proxying**: Unified API to access 500+ AI models from 500+ providers
- **User Authentication**: Secure login and registration
- **API Key Management**: Create, view, and delete API keys
- **Rate Limiting**: Prevent abuse with configurable limits
- **Load Balancing**: Distribute requests across providers
- **Web Dashboard**: User-friendly interface for key management, usage statistics, logs, and billing
- **Error Handling**: Robust retries and fallback mechanisms
- **Payment Integration**: Support for credits and subscriptions
- **Documentation**: Comprehensive API reference
- **Scalability**: Designed for production deployment

## Supported Models

### Text Generation (200+ models)
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-4o, GPT-3.5 Turbo, etc.
- **Anthropic**: Claude-3 Opus, Claude-3 Sonnet, Claude-3 Haiku, etc.
- **Google**: Gemini-1.5 Pro, Gemini-1.5 Flash, etc.
- **Meta**: Llama-3 70B, Llama-3 8B, CodeLlama, etc.
- **Cohere**: Command-R, Command-R Plus, etc.
- **Mistral**: Mistral-7B, Mixtral-8x7B, etc.
- **Qwen**: Qwen-72B, Qwen-Turbo, etc.
- **Other**: DeepSeek Coder, StarCoder, Phi-2, etc.

### Image Generation (50+ models)
- **OpenAI**: DALL-E 3, DALL-E 2
- **Stability AI**: Stable Diffusion XL, SD-2, SD-3
- **Midjourney**: Midjourney V5, V6
- **Google**: Imagen-2, Imagen-3
- **Flux**: Flux-1 Dev, Flux-1 Schnell
- **Kandinsky**: Kandinsky-2, Kandinsky-3

### Audio Processing (30+ models)
- **OpenAI**: Whisper-1, TTS-1, TTS-1 HD
- **ElevenLabs**: Eleven Multilingual V2, English V2
- **Google**: Text-to-Speech, Speech-to-Text
- **Suno**: Suno V3, V4
- **Tortoise**: Tortoise TTS

### Video Generation (10+ models)
- **OpenAI**: Sora
- **Runway**: Gen-2, Gen-3
- **Pika Labs**: Pika Labs
- **Stability AI**: Stable Video Diffusion

### Multimodal (20+ models)
- **OpenAI**: GPT-4 Vision, GPT-4o Vision
- **Google**: Gemini Pro Vision, Gemini-1.5 Pro Vision
- **Anthropic**: Claude-3 Vision
- **Other**: CLIP, BLIP, LLaVA

### Code & Development (40+ models)
- **OpenAI**: GPT-4 Code, Codex
- **Anthropic**: Claude Code
- **Google**: Codey, Code Gecko
- **Meta**: CodeLlama
- **Other**: StarCoder, DeepSeek Coder, CodeQwen

### Embeddings (20+ models)
- **OpenAI**: Text-Embedding-Ada-002, Text-Embedding-3
- **Cohere**: Embed English V3.0, Multilingual V3.0
- **Google**: Text-Embedding-004
- **Other**: Sentence Transformers, E5-Large

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Rate Limiting**: express-rate-limit

## Setup

### Prerequisites

- Node.js
- MongoDB
- API keys for providers (OpenAI, Anthropic, etc.)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd Zhenbah Hub/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Copy `.env` and update with your keys and MongoDB URI

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd Zhenbah Hub/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Register/Login via the frontend dashboard
2. Create API keys
3. Use the keys to make requests to the API endpoints (e.g., `/v1/chat/completions`)

## API Endpoints

### AI Model Endpoints
- `GET /v1/models`: List all supported models
- `POST /v1/chat/completions`: Text generation and chat
- `POST /v1/images/generations`: Image generation
- `POST /v1/images/edits`: Image editing
- `POST /v1/images/variations`: Image variations
- `POST /v1/audio/transcriptions`: Audio transcription
- `POST /v1/audio/translations`: Audio translation
- `POST /v1/audio/speech`: Text-to-speech
- `POST /v1/embeddings`: Text embeddings

### User Management
- `POST /auth/register`: User registration
- `POST /auth/login`: User login
- `GET /keys`: Get user's API keys
- `POST /keys`: Create new API key
- `DELETE /keys/:id`: Delete API key

## Deployment

For production, use Docker or deploy to a cloud service like Heroku, Vercel, etc.

## Contributing

Contributions are welcome. Please follow standard practices.

## License

ISC