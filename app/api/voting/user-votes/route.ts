import { NextResponse } from 'next/server';

// Simple in-memory cache for user votes
const votesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 15000; // 15 seconds

export async function POST(request: Request) {
  const { address } = await request.json();
  
  // Check cache first
  const cached = votesCache.get(address);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }
  
  try {
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    // Fetch transactions for the user's address
    const response = await fetch(
      `https://api.hiro.so/extended/v1/address/${address}/transactions?limit=50`,
      {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Hiro API error:', response.status, text);
      return NextResponse.json({ error: 'Failed to fetch transactions', details: text }, { status: response.status });
    }

    const data = await response.json();

    // Filter for vote transactions on our contract
    const votedPolls = new Set<number>();
    
    if (data.results) {
      for (const tx of data.results) {
        // Check if it's a contract call to our voting contract
        if (
          tx.tx_type === 'contract_call' &&
          tx.contract_call?.contract_id === 'SP33Y8RCP74098JCSPW5QHHCD6QN4H3XS9DM3QXXX.Blackadam-Voting-Contract' &&
          tx.contract_call?.function_name === 'vote' &&
          tx.tx_status === 'success'
        ) {
          // Extract poll-id from function args
          const args = tx.contract_call.function_args;
          if (args && args[0]) {
            // Parse the poll-id (first argument)
            const pollIdArg = args[0];
            if (pollIdArg.repr) {
              // Extract number from "u0", "u1", etc.
              const pollId = parseInt(pollIdArg.repr.replace('u', ''));
              votedPolls.add(pollId);
            }
          }
        }
      }
    }

    const result = { votedPolls: Array.from(votedPolls) };
    
    // Cache the result
    votesCache.set(address, {
      data: result,
      timestamp: Date.now()
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch user votes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user votes', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
