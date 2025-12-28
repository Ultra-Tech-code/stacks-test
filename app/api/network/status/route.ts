import { NextResponse } from 'next/server';

// Cache for network status
let statusCache: { data: any; timestamp: number } | null = null;
const STATUS_CACHE_TTL = 10000; // 10 seconds

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (statusCache && (now - statusCache.timestamp) < STATUS_CACHE_TTL) {
      return NextResponse.json(statusCache.data);
    }

    // Fetch from Hiro API
    const response = await fetch('https://api.hiro.so/extended/v1/status', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Update cache
    statusCache = {
      data: {
        txCount: data.tx_count || 0,
      },
      timestamp: now,
    };

    return NextResponse.json(statusCache.data);
  } catch (error) {
    console.error('Error fetching network status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network status' },
      { status: 500 }
    );
  }
}
