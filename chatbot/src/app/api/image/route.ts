import { NextRequest, NextResponse } from 'next/server';

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
].filter((key): key is string => Boolean(key));

const infipApiKey = process.env.INFIP_API_KEY;
const infipApiUrl = process.env.INFIP_API_URL || "https://api.infip.pro/v1/images/generations";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, isUncontent, useImagen3, size = '1024x1024' } = body;

    console.log('Generating image with prompt:', prompt);

    let imageUrl = '';

    // Handle uncontent images using Infip API
    if (isUncontent && infipApiKey) {
      try {
        const infipResponse = await makeApiCall(infipApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${infipApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "uncen",
            prompt: prompt,
            n: 1,
            response_format: "url",
            size: size
          })
        });

        if (infipResponse.ok) {
          const infipData = await infipResponse.json();
          if (infipData.data && infipData.data[0]) {
            imageUrl = infipData.data[0].url;
          }
        }
      } catch (infipError) {
        console.error('Infip API error:', infipError);
      }
    }

    // Fallback to A4F API if Infip failed or not uncontent
    if (!imageUrl) {
      const a4fKey = getRandomApiKey(a4fKeys);
      if (!a4fKey) {
        throw new Error('No A4F API keys available');
      }

      const model = useImagen3 ? "provider-1/FLUX.1-kontext-pro" : "provider-6/gpt-image-1";

      const a4fResponse = await makeApiCall(`${A4F_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${a4fKey}`
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          n: 1,
          size: size
        })
      });

      if (a4fResponse.ok) {
        const a4fData = await a4fResponse.json();
        if (a4fData.data && a4fData.data[0]) {
          imageUrl = a4fData.data[0].url || a4fData.data[0].image_url;
        }
      } else {
        throw new Error(`A4F API error: ${a4fResponse.status}`);
      }
    }

    if (!imageUrl) {
      throw new Error('Failed to generate image from any service');
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      size: size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Image generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Image and prompt are required' },
        { status: 400 }
      );
    }

    console.log('Transforming image with prompt:', prompt);

    const a4fKey = getRandomApiKey(a4fKeys);
    if (!a4fKey) {
      throw new Error('No A4F API keys available');
    }

    // Convert image to base64 for API
    const imageBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64Image}`;

    // Call A4F image edit API
    const a4fResponse = await makeApiCall(`${A4F_BASE_URL}/images/edits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${a4fKey}`
      },
      body: JSON.stringify({
        model: "provider-6/black-forest-labs-flux-1-kontext-pro",
        image: dataUrl,
        prompt: prompt,
        response_format: "url"
      })
    });

    if (a4fResponse.ok) {
      const a4fData = await a4fResponse.json();
      if (a4fData.data && a4fData.data[0]) {
        const transformedImageUrl = a4fData.data[0].url;

        return NextResponse.json({
          success: true,
          originalImage: image.name,
          transformedImageUrl: transformedImageUrl,
          prompt: prompt,
          timestamp: new Date().toISOString()
        });
      }
    }

    throw new Error(`A4F API error: ${a4fResponse.status}`);

  } catch (error) {
    console.error('Image transformation error:', error);
    return NextResponse.json(
      { error: 'Image transformation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}