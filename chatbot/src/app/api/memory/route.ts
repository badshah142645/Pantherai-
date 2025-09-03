import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo - in production, use a database
let conversationHistory: Array<{ role: string; content: string; timestamp: Date }> = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Return recent conversation history
    const recentHistory = conversationHistory.slice(-limit);

    return NextResponse.json({
      success: true,
      history: recentHistory,
      total: conversationHistory.length
    });

  } catch (error) {
    console.error('Memory retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, action } = body;

    if (action === 'save') {
      // Save new messages to history
      if (messages && Array.isArray(messages)) {
        conversationHistory.push(...messages);
        // Keep only last 1000 messages to prevent memory issues
        if (conversationHistory.length > 1000) {
          conversationHistory = conversationHistory.slice(-1000);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Messages saved to memory',
        totalMessages: conversationHistory.length
      });

    } else if (action === 'clear') {
      // Clear conversation history
      conversationHistory = [];

      return NextResponse.json({
        success: true,
        message: 'Conversation history cleared'
      });

    } else if (action === 'search') {
      // Search through conversation history
      const { query } = body;
      if (!query) {
        return NextResponse.json(
          { error: 'Query is required for search' },
          { status: 400 }
        );
      }

      const matchingMessages = conversationHistory.filter(msg =>
        msg.content && msg.content.toLowerCase().includes(query.toLowerCase())
      );

      return NextResponse.json({
        success: true,
        query,
        results: matchingMessages,
        totalResults: matchingMessages.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Memory operation error:', error);
    return NextResponse.json(
      { error: 'Memory operation failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Clear all conversation history
    conversationHistory = [];

    return NextResponse.json({
      success: true,
      message: 'All conversation history cleared'
    });

  } catch (error) {
    console.error('Memory clear error:', error);
    return NextResponse.json(
      { error: 'Failed to clear memory' },
      { status: 500 }
    );
  }
}