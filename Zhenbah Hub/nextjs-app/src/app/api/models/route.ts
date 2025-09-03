import { NextRequest, NextResponse } from 'next/server';
import modelsData from '../../../data/models.json';
import providersData from '../../../data/providers.json';

export async function GET(request: NextRequest) {
  try {
    const allModels: any[] = [];

    Object.keys(modelsData).forEach(category => {
      Object.keys((modelsData as any)[category]).forEach(provider => {
        (modelsData as any)[category][provider].forEach((model: string) => {
          // Add pricing tier and pricing information
          let pricing_tier = 'free';
          let pricing = null;

          // Simulate pricing for some models (in production, this would come from a database)
          if (model.includes('gpt-4') || model.includes('claude-3') || model.includes('dall-e-3')) {
            pricing_tier = 'pro';
            pricing = {
              input: 0.002,
              output: 0.002
            };
          }

          allModels.push({
            id: model,
            object: 'model',
            created: Date.now(),
            owned_by: provider,
            category: category,
            pricing_tier: pricing_tier,
            pricing: pricing
          });
        });
      });
    });

    return NextResponse.json({
      object: 'list',
      data: allModels
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}