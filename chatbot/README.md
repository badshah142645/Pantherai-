# Panther AI - Next.js Chatbot

A fully functional ChatGPT-like chatbot website built with Next.js, replicating the exact same chatbot behavior, UI/UX, and features from the original Python Gradio implementation.

## 🚀 Features

### Core Functionality
- **Multi-Agent Research System**: 10 specialized AI agents for comprehensive analysis
- **Real-time Web Search**: DuckDuckGo primary + Google fallback with parallel processing
- **Image Generation & Transformation**: Support for both regular and uncontent images
- **File Processing**: PDF, image, video, and text file analysis
- **Conversation Memory**: Persistent chat history with context awareness
- **Streaming Responses**: Real-time message streaming

### AI Modes
- **Normal Mode**: Standard conversational AI
- **Think Mode**: Deep reasoning and step-by-step analysis
- **DeepSearch Mode**: Comprehensive web search with detailed analysis
- **DeepResearch Mode**: Multi-agent research system
- **Web Search Mode**: Real-time web browsing capabilities
- **Image Generation Mode**: AI-powered image creation

### Advanced Features
- **API Key Fallback System**: Automatic failover between multiple API providers
- **Trusted Domain Filtering**: AI-powered domain selection for reliable sources
- **Parallel Search Processing**: Multi-threaded search for faster results
- **Video Analysis**: Frame-by-frame video processing and transcription
- **PDF Generation**: Create and download PDF documents
- **File Upload Support**: Images, PDFs, videos, and text files
- **Responsive Design**: Mobile-friendly ChatGPT-like interface

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Backend (Python)
- **Flask** - Web framework
- **OpenAI API** - Multiple AI providers (A4F, Sarvam)
- **DuckDuckGo Search** - Primary search engine
- **Google Search** - Fallback search engine
- **PIL/Pillow** - Image processing
- **pdfplumber** - PDF text extraction
- **moviepy** - Video processing
- **langdetect** - Language detection
- **wikipedia** - Wikipedia integration

## 📁 Project Structure

```
chatbot/
├── src/
│   └── app/
│       ├── layout.tsx          # Root layout
│       ├── page.tsx            # Main chat interface
│       ├── globals.css         # Global styles
│       └── api/
│           ├── chat/
│           │   └── route.ts     # Chat API endpoint
│           ├── image/
│           │   └── route.ts     # Image generation API
│           ├── search/
│           │   └── route.ts     # Search API endpoint
│           ├── file/
│           │   └── route.ts     # File upload API
│           └── memory/
│               └── route.ts     # Memory management API
├── backend.py                  # Complete Python backend
├── package.json               # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS config
├── next.config.ts            # Next.js configuration
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.8+**
- **npm or yarn**

### 1. Frontend Setup

```bash
# Navigate to chatbot directory
cd chatbot

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 2. Backend Setup

```bash
# Install Python dependencies
pip install flask flask-cors openai duckduckgo-search googlesearch-python pillow pdfplumber moviepy opencv-python langdetect wikipedia python-dotenv requests

# Set up environment variables
# Edit the .env file with your API keys
```

### 3. Environment Variables

Create a `.env` file in the chatbot directory:

```env
# A4F API Keys (multiple for load balancing)
A4F_API_KEY_1=your_a4f_key_1
A4F_API_KEY_2=your_a4f_key_2
# ... up to A4F_API_KEY_10

# Sarvam API Keys (multiple for load balancing)
SARVAM_API_KEY_1=your_sarvam_key_1
SARVAM_API_KEY_2=your_sarvam_key_2
# ... up to SARVAM_API_KEY_18

# YouTube API Key
YOUTUBE_API_KEY=your_youtube_api_key

# Infip API (for uncontent images)
INFIP_API_KEY=your_infip_key
INFIP_API_URL=https://api.infip.pro/v1/images/generations

# A4F Base URL
A4F_BASE_URL=https://api.a4f.co/v1

# Application Settings
MEMORY_FILE=memory.json
MAX_FILE_SIZE=10485760
LOG_LEVEL=INFO
ENABLE_API_LOGGING=true

# Model Configurations
DEFAULT_CHAT_MODEL=sarvam-m
DEFAULT_IMAGE_MODEL=provider-6/gpt-image-1
DEFAULT_VISION_MODEL=provider-3/gpt-4.1-mini
DEFAULT_DEEPSEARCH_MODEL=provider-6/gemini-2.5-flash
DEFAULT_DEEPRESEARCH_MODEL=provider-6/gemibni-2.5-flash-thinking
DEFAULT_THINK_MODEL=provider-1/deepseek-r1-0528
```

### 4. Start Backend Server

```bash
# Run the Python backend
python backend.py
```

The backend will be available at `http://localhost:5000`

## 🎯 Usage

### Basic Chat
1. Open the application in your browser
2. Type your message in the input field
3. Press Enter or click the Send button
4. The AI will respond with streaming text

### Advanced Modes
- **Think Mode**: Enable for deep reasoning and analysis
- **DeepSearch Mode**: Enable for comprehensive web research
- **DeepResearch Mode**: Enable for multi-agent analysis
- **Web Search Mode**: Enable for real-time web browsing
- **Image Generation Mode**: Enable for AI image creation

### File Upload
- Click the upload button to select files
- Supported formats: PDF, TXT, CSV, LOG, MD, MP4, MOV, AVI, MKV, JPG, JPEG, PNG, GIF, BMP, WEBP
- Files are automatically analyzed and processed

### Image Features
- Upload images for analysis
- Generate new images with prompts
- Transform existing images with AI

## 🔧 API Endpoints

### Chat API
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "modes": ["think"],
  "files": [],
  "image": null
}
```

### Image Generation
```http
POST /api/image
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "isUncontent": false,
  "useImagen3": false,
  "size": "1024x1024"
}
```

### Web Search
```http
POST /api/search
Content-Type: application/json

{
  "query": "latest AI developments",
  "deepsearch": true,
  "deepresearch": false,
  "includeYouTube": true
}
```

### File Upload
```http
POST /api/file
Content-Type: multipart/form-data

file: [uploaded file]
```

### Memory Management
```http
GET /api/memory     # Get conversation history
DELETE /api/memory  # Clear conversation history
```

## 🔍 Key Features Explained

### Multi-Agent Research System
The system uses 10 specialized AI agents:
1. **Language Understanding Agent** - Analyzes query intent
2. **Knowledge Retriever Agent** - Identifies information needs
3. **Reasoning & Logic Agent** - Performs logical analysis
4. **Emotion & Tone Analyzer Agent** - Analyzes emotional context
5. **Creative Generator Agent** - Produces innovative solutions
6. **Coding & Technical Expert Agent** - Handles technical queries
7. **Memory & Learning Agent** - Manages conversation context
8. **Multilingual & Translation Agent** - Handles language tasks
9. **Reality Checker Agent** - Verifies factual accuracy
10. **Synthesizer Agent** - Combines all inputs into final response

### Parallel Search Processing
- Uses multiple threads for faster search results
- DuckDuckGo as primary search engine
- Google Search as fallback
- YouTube and Wikipedia integration
- Trusted domain filtering

### API Key Management
- Load balancing across multiple API keys
- Automatic failover when keys fail
- Different keys for different AI providers
- Rate limiting and retry logic

## 🚀 Deployment

### Vercel Deployment (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Backend Deployment
The Python backend can be deployed to:
- **Heroku**
- **AWS EC2**
- **Google Cloud Run**
- **DigitalOcean App Platform**
- **Railway**

### Environment Setup for Production
```bash
# Set production environment variables
export FLASK_ENV=production
export LOG_LEVEL=WARNING
export ENABLE_API_LOGGING=false
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure all required API keys are set in `.env`
   - Check API key validity and quotas
   - Verify network connectivity

2. **File Upload Issues**
   - Check file size limits
   - Verify supported file formats
   - Ensure upload directory permissions

3. **Search Failures**
   - Check internet connectivity
   - Verify search API availability
   - Review rate limits

4. **Image Generation Errors**
   - Confirm image API keys
   - Check prompt content guidelines
   - Verify image size limits

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
export ENABLE_API_LOGGING=true
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🔄 Updates

The application automatically handles:
- API key rotation and failover
- Search result caching
- Memory management
- Error recovery and retries

---

**Built with ❤️ using Next.js, TypeScript, and Python**
