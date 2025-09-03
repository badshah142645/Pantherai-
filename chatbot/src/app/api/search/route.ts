import { NextRequest, NextResponse } from 'next/server';

// Environment variables for API keys
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

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
    const { query, deepsearch = false, deepresearch = false, includeYouTube = true } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Mock search results - replace with actual Python backend web search
    console.log(`Searching for: ${query} (deepsearch: ${deepsearch}, deepresearch: ${deepresearch})`);

    // Simulate search time
    await new Promise(resolve => setTimeout(resolve, deepresearch ? 4000 : deepsearch ? 2000 : 1000));

    const mockResults = [];

    // Generate mock search results
    for (let i = 1; i <= (deepresearch ? 20 : deepsearch ? 10 : 5); i++) {
      mockResults.push({
        title: `Search Result ${i}: ${query} - ${['Guide', 'Tutorial', 'Analysis', 'Review', 'News'][i % 5]}`,
        url: `https://example.com/result${i}`,
        snippet: `This is a mock search result snippet for "${query}". In the real implementation, this would be actual web content scraped and analyzed by the Python backend's search capabilities. Result ${i} contains relevant information about the search query.`,
        source_type: ['web', 'trusted', 'academic', 'news'][i % 4],
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Add YouTube results if requested
    if (includeYouTube) {
      for (let i = 1; i <= 3; i++) {
        mockResults.push({
          title: `[Video] ${query} Tutorial ${i}`,
          url: `https://youtube.com/watch?v=mockvideo${i}`,
          snippet: `YouTube video about ${query}. Duration: ${Math.floor(Math.random() * 30) + 5} minutes. ${Math.floor(Math.random() * 100000) + 10000} views.`,
          source_type: 'video',
          date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // Add Wikipedia result
    mockResults.push({
      title: `Wikipedia: ${query}`,
      url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
      snippet: `Encyclopedia entry for ${query}. This would contain comprehensive information from Wikipedia, processed by the Python backend's knowledge retrieval system.`,
      source_type: 'encyclopedia',
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    return NextResponse.json({
      success: true,
      query,
      results: mockResults,
      totalResults: mockResults.length,
      searchType: deepresearch ? 'deepresearch' : deepsearch ? 'deepsearch' : 'standard',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// YouTube-specific search
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, maxResults = 5 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!youtubeApiKey) {
      console.warn('YouTube API key not configured, returning mock results');
      // Fallback to mock results if API key is not available
      const mockYouTubeResults = [];
      for (let i = 1; i <= maxResults; i++) {
        mockYouTubeResults.push({
          title: `${query} - Episode ${i} | Full Tutorial`,
          url: `https://youtube.com/watch?v=ytmock${i}`,
          snippet: `Complete guide to ${query}. ${Math.floor(Math.random() * 50) + 10} minutes long. Channel: TechTutorials. ${Math.floor(Math.random() * 500000) + 50000} views.`,
          channelTitle: 'TechTutorials',
          publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          duration: `${Math.floor(Math.random() * 30) + 5}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
        });
      }

      return NextResponse.json({
        success: true,
        query,
        results: mockYouTubeResults,
        totalResults: mockYouTubeResults.length,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`YouTube search for: ${query}`);

    // YouTube API search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${youtubeApiKey}&type=video&order=date`;

    const searchResponse = await makeApiCall(searchUrl, {});

    if (!searchResponse.ok) {
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    // Get video details for duration
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${youtubeApiKey}`;

    const detailsResponse = await makeApiCall(detailsUrl, {});
    const detailsData = detailsResponse.ok ? await detailsResponse.json() : null;

    const youtubeResults = searchData.items.map((item: any, index: number) => {
      const duration = detailsData?.items?.[index]?.contentDetails?.duration || 'PT10M0S';

      // Parse ISO 8601 duration to readable format
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = match?.[1] ? parseInt(match[1].replace('H', '')) : 0;
      const minutes = match?.[2] ? parseInt(match[2].replace('M', '')) : 0;
      const seconds = match?.[3] ? parseInt(match[3].replace('S', '')) : 0;

      let durationString = '';
      if (hours > 0) durationString += `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      else durationString += `${minutes}:${seconds.toString().padStart(2, '0')}`;

      return {
        title: item.snippet.title,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        snippet: item.snippet.description || `YouTube video about ${query}`,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: durationString
      };
    });

    return NextResponse.json({
      success: true,
      query,
      results: youtubeResults,
      totalResults: youtubeResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { error: 'YouTube search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}