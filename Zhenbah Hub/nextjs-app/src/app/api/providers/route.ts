import { NextRequest, NextResponse } from 'next/server';
import providersData from '../../../data/providers.json';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(providersData.providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}