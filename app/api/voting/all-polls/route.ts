import { NextResponse } from 'next/server';

// Simple in-memory cache
let pollsCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 10000; // 10 seconds

// Helper to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
  // Check cache first
  if (pollsCache && Date.now() - pollsCache.timestamp < CACHE_DURATION) {
    return NextResponse.json(pollsCache.data);
  }
  try {
    const { sender } = await request.json();
    
    // Get poll count first
    const countResponse = await fetch(
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

    if (!countResponse.ok) {
      const text = await countResponse.text();
      console.error('Hiro API error (count):', countResponse.status, text);
      return NextResponse.json({ error: 'Failed to get poll count', details: text }, { status: countResponse.status });
    }

    const countData = await countResponse.json();
    
    // Parse Clarity uint from response
    // Format: 0x07 (response-ok) + 0x01 (uint) + 32 hex chars (16 bytes big-endian)
    const result = countData.result;
    const hexWithoutPrefix = result.replace('0x0701', '');
    const count = parseInt(hexWithoutPrefix, 16);
    
    if (count === 0) {
      return NextResponse.json({ polls: [], count: 0 });
    }

    // Fetch polls with rate limiting (batches of 5 with delays)
    const pollResults = [];
    const batchSize = 5;
    
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize, count);
      
      for (let j = i; j < end; j++) {
        const pollIdHex = j.toString(16).padStart(32, '0');
        const clarityUint = `0x01${pollIdHex}`;
        
        batch.push(
          fetch(
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
          ).then(res => res.json()).catch(err => ({ error: err.message, pollId: j }))
        );
      }
      
      const batchResults = await Promise.all(batch);
      pollResults.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (end < count) {
        await delay(1000); // 1 second delay between batches
      }
    }
    
    const result = {
      count,
      polls: pollResults
    };
    
    // Cache the result
    pollsCache = {
      data: result,
      timestamp: Date.now()
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch all polls:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch polls', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
