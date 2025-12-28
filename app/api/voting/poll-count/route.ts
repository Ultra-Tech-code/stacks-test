import { NextResponse } from 'next/server';

// Simple in-memory cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export async function POST(request: Request) {
  try {
    // Check cache first
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log('Returning cached poll count');
      return NextResponse.json(cache.data);
    }

    const { sender } = await request.json();
    
    const response = await fetch(
      'https://api.hiro.so/v2/contracts/call-read/SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX/Blackadam-Voting-Contract/get-poll-count',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: sender || 'SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX',
          arguments: [],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Hiro API error:', response.status, text);
      
      // Return cached data if available, even if expired
      if (cache) {
        console.log('Returning stale cache due to API error');
        return NextResponse.json(cache.data);
      }
      
      return NextResponse.json({ error: 'Hiro API error', details: text }, { status: response.status });
    }

    const data = await response.json();
    
    // Update cache
    cache = {
      data,
      timestamp: Date.now()
    };
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch poll count:', error);
    
    // Return cached data if available
    if (cache) {
      console.log('Returning stale cache due to error');
      return NextResponse.json(cache.data);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch poll count', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
