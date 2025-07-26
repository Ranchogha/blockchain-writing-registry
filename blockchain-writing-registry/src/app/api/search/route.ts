import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Simple test endpoint to verify the API is working
  return NextResponse.json({
    success: true,
    message: 'Search API is working - using Origin SDK for data fetching',
    dataSource: 'Origin SDK (client-side)'
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchType, searchValue } = await request.json();

    console.log('🔍 API Search Request:', { searchType, searchValue });

    if (!searchType || !searchValue) {
      return NextResponse.json(
        { error: 'Search type and value are required' },
        { status: 400 }
      );
    }

    // Since we're now using Origin SDK directly in the client component,
    // this API route is no longer needed for data fetching
    return NextResponse.json({
      success: true,
      message: 'Search functionality moved to client-side using Origin SDK',
      dataSource: 'Origin SDK (client-side)'
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 