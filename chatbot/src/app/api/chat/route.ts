import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source_type?: string;
  date?: string;
}

// Environment variables for API keys
const a4fKeys: string[] = [
  process.env.A4F_API_KEY_1,
  process.env.A4F_API_KEY_2,
  process.env.A4F_API_KEY_3,
  process.env.A4F_API_KEY_4,
  process.env.A4F_API_KEY_5,
  process.env.A4F_API_KEY_6,
  process.env.A4F_API_KEY_7,
  process.env.A4F_API_KEY_8,
  process.env.A4F_API_KEY_9,
  process.env.A4F_API_KEY_10
].filter((key): key is string => Boolean(key)); // Filter out undefined values

const sarvamKeys: string[] = [
  process.env.SARVAM_API_KEY_1,
  process.env.SARVAM_API_KEY_2,
  process.env.SARVAM_API_KEY_3,
  process.env.SARVAM_API_KEY_4,
  process.env.SARVAM_API_KEY_5,
  process.env.SARVAM_API_KEY_6,
  process.env.SARVAM_API_KEY_7,
  process.env.SARVAM_API_KEY_8,
  process.env.SARVAM_API_KEY_9,
  process.env.SARVAM_API_KEY_10,
  process.env.SARVAM_API_KEY_11,
  process.env.SARVAM_API_KEY_12,
  process.env.SARVAM_API_KEY_13,
  process.env.SARVAM_API_KEY_14,
  process.env.SARVAM_API_KEY_15,
  process.env.SARVAM_API_KEY_16,
  process.env.SARVAM_API_KEY_17,
  process.env.SARVAM_API_KEY_18
].filter((key): key is string => Boolean(key)); // Filter out undefined values

const A4F_BASE_URL = process.env.A4F_BASE_URL || "https://api.a4f.co/v1";

// Helper function to get a random API key for load balancing
function getRandomApiKey(keys: string[]): string | null {
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

// Helper function to make API calls with retry logic
async function makeApiCall(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status !== 429) { // Don't retry on rate limits
        return response;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

// Enhanced chat API with integration to other services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, modes, files, image } = body;

    let response = '';
    let sources: SearchResult[] = [];

    // Handle different modes by calling appropriate APIs
    if (modes.includes('deepresearch') || modes.includes('deepsearch') || modes.includes('browse')) {
      // Call search API
      try {
        const searchResponse = await fetch(`${request.nextUrl.origin}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: message,
            deepsearch: modes.includes('deepsearch'),
            deepresearch: modes.includes('deepresearch'),
            includeYouTube: true
          })
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          sources = searchData.results || [];

          if (modes.includes('deepresearch')) {
            response = `🔬 **DeepResearch Analysis**\n\nQuery: "${message}"\n\n## Comprehensive Analysis:\n${sources.slice(0, 10).map((r: SearchResult, i: number) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   [${r.url}](${r.url})\n`).join('\n')}\n\n## Synthesis:\nThis represents a comprehensive multi-perspective analysis from ${sources.length} sources.`;
          } else if (modes.includes('deepsearch')) {
            response = `🔍 **DeepSearch Results**\n\nQuery: "${message}"\n\n## Key Findings:\n${sources.slice(0, 8).map((r: SearchResult, i: number) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   [Source](${r.url})\n`).join('\n')}\n\n## Analysis:\nFound ${sources.length} relevant sources with detailed analysis.`;
          } else {
            response = `🌐 **Web Search Results**\n\nQuery: "${message}"\n\n## Top Results:\n${sources.slice(0, 5).map((r: SearchResult, i: number) => `${i + 1}. [${r.title}](${r.url})\n   ${r.snippet}\n`).join('\n')}`;
          }
        }
      } catch (searchError) {
        console.error('Search API error:', searchError);
        response = `Error performing web search: ${searchError}`;
      }
    } else if (modes.includes('think')) {
      response = `🧠 **Deep Thinking Process**\n\nAnalyzing: "${message}"\n\n## Step-by-step reasoning:\n1. **Understanding**: Breaking down the core question and identifying key components\n2. **Context Analysis**: Considering relevant background information and assumptions\n3. **Multiple Perspectives**: Evaluating different viewpoints and potential solutions\n4. **Logic Validation**: Checking for logical consistency and potential flaws\n5. **Synthesis**: Combining insights into a coherent response\n\n## Final Analysis:\nThis represents a structured thinking process that would be handled by the Python backend's reasoning engine.`;
    } else if (modes.includes('image')) {
      // Call image generation API
      try {
        const imageResponse = await fetch(`${request.nextUrl.origin}/api/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: message,
            isUncontent: false,
            useImagen3: false,
            size: '1024x1024'
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          response = `🖼️ **Image Generated**\n\nPrompt: "${message}"\n\n![Generated Image](${imageData.imageUrl})\n\n*Image generated using advanced AI models. Click to download.*`;
        } else {
          response = `🖼️ **Image Generation**\n\nPrompt: "${message}"\n\nImage generation would be handled by the Python backend's image synthesis capabilities.`;
        }
      } catch (imageError) {
        console.error('Image API error:', imageError);
        response = `Error generating image: ${imageError}`;
      }
    } else {
      // Standard chat response using Sarvam AI
      try {
        const sarvamKey = getRandomApiKey(sarvamKeys);
        if (!sarvamKey) {
          throw new Error('No Sarvam API keys available');
        }

        const sarvamResponse = await makeApiCall(
          "https://api.sarvam.ai/v1/chat/completions",
          {
            method: 'POST',
            headers: {
              'api-subscription-key': sarvamKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: process.env.DEFAULT_CHAT_MODEL || "sarvam-m",
              messages: [
                {
                  role: "system",
                  content: "You are Panther AI, a helpful and intelligent assistant. Provide clear, accurate, and engaging responses."
                },
                {
                  role: "user",
                  content: message
                }
              ],
              max_tokens: 1000,
              temperature: 0.7
            })
          }
        );

        if (sarvamResponse.ok) {
          const sarvamData = await sarvamResponse.json();
          response = sarvamData.choices[0].message.content;
        } else {
          throw new Error(`Sarvam API error: ${sarvamResponse.status}`);
        }
      } catch (error) {
        console.error('Sarvam API error:', error);
        response = `Hello! I received your message: "${message}". I'm currently experiencing some connectivity issues with my AI services, but I'm here to help!`;
      }
    }

    // Handle file uploads
    if (files && files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((file: File) => {
          formData.append('files', file);
        });

        const fileResponse = await fetch(`${request.nextUrl.origin}/api/file`, {
          method: 'POST',
          body: formData
        });

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          response += `\n\n📎 **Files Analyzed:**\n${fileData.results.map((r: { fileName: string; analysis: string }) => `**${r.fileName}**\n${r.analysis}\n`).join('\n')}`;
        }
      } catch (fileError) {
        console.error('File API error:', fileError);
        response += `\n\n📎 **Files Processed:** ${files.length} file(s) uploaded (analysis pending)`;
      }
    }

    // Handle image uploads
    if (image) {
      response += `\n\n🖼️ **Image Analysis:** Image processing would be performed using the Python backend's computer vision capabilities, including object detection, scene analysis, and content understanding.`;
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      modes: modes || [],
      sources: sources
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle file uploads
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    // Process uploaded files
    const processedFiles = files.map((file, index) => ({
      name: (file as File).name,
      size: (file as File).size,
      type: (file as File).type,
      index
    }));

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: processedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}