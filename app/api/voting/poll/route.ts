import { NextResponse } from 'next/server';

// Simple in-memory cache for polls
const pollCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function POST(request: Request) {
  try {
    const { sender, pollId } = await request.json();
    
    // Check cache first
    const cached = pollCache.get(pollId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Returning cached poll ${pollId}`);
      return NextResponse.json(cached.data);
    }
    
    // Encode pollId as Clarity uint (0x01 prefix + 16 bytes in big-endian)
    const pollIdHex = pollId.toString(16).padStart(32, '0');
    const clarityUint = `0x01${pollIdHex}`;
    
    const response = await fetch(
      'https://api.hiro.so/v2/contracts/call-read/SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX/Blackadam-Voting-Contract/get-poll',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: sender || 'SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX',
          arguments: [clarityUint],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Hiro API error:', response.status, text);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`Returning stale cache for poll ${pollId} due to API error`);
        return NextResponse.json(cached.data);
      }
      
      return NextResponse.json({ error: 'Hiro API error', details: text }, { status: response.status });
    }

    const data = await response.json();
    
    // Update cache
    pollCache.set(pollId, {
      data,
      timestamp: Date.now()
    });
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch poll:', error);
    
    const { pollId } = await request.json();
    const cached = pollCache.get(pollId);
    
    // Return cached data if available
    if (cached) {
      console.log(`Returning stale cache for poll ${pollId} due to error`);
      return NextResponse.json(cached.data);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch poll', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
