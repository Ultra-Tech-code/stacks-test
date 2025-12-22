import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pollId } = body;
    
    console.log('Received request for pollId:', pollId, 'Type:', typeof pollId);
    
    // Allow 0 as a valid pollId
    if (pollId === undefined || pollId === null || (typeof pollId !== 'number' && isNaN(Number(pollId)))) {
      console.error('Invalid pollId:', pollId);
      return NextResponse.json({ error: 'Valid Poll ID required' }, { status: 400 });
    }

    const numericPollId = typeof pollId === 'number' ? pollId : Number(pollId);
    const contractId = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G.Blackadam-vote-contract';

    interface Voter {
      address: string;
      vote: 'yes' | 'no';
      timestamp: number;
      txId: string;
    }

    const voters: Voter[] = [];
    let offset = 0;
    const limit = 50; // Max allowed by Hiro API
    let hasMore = true;

    // Fetch transactions with pagination
    while (hasMore && offset < 200) { // Limit to 4 pages max (200 transactions)
      const url = `https://api.testnet.hiro.so/extended/v1/address/${contractId.split('.')[0]}/transactions?limit=${limit}&offset=${offset}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        return NextResponse.json({ 
          error: 'Failed to fetch transactions', 
          status: response.status,
          details: errorText 
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('Fetched transactions:', data.results?.length || 0);

      if (data.results && data.results.length > 0) {
        for (const tx of data.results) {
          // Check if it's a vote transaction for this specific poll
          if (
            tx.tx_type === 'contract_call' &&
            tx.contract_call?.contract_id === contractId &&
            tx.contract_call?.function_name === 'vote' &&
            tx.tx_status === 'success'
          ) {
            const args = tx.contract_call.function_args;
            if (args && args.length >= 2) {
              // First arg is poll-id, second is vote (bool)
              const pollIdArg = args[0];
              const voteArg = args[1];
              
              if (pollIdArg.repr) {
                const txPollId = parseInt(pollIdArg.repr.replace('u', ''));
                
                if (txPollId === numericPollId) {
                  const vote = voteArg.repr === 'true' ? 'yes' : 'no';
                  
                  voters.push({
                    address: tx.sender_address,
                    vote,
                    timestamp: tx.burn_block_time,
                    txId: tx.tx_id
                  });
                }
              }
            }
          }
        }

        // Check if there are more transactions
        hasMore = data.results.length === limit;
        offset += limit;
      } else {
        hasMore = false;
      }
    }

    // Sort by timestamp (most recent first)
    voters.sort((a, b) => b.timestamp - a.timestamp);

    const result = {
      pollId: numericPollId,
      voters,
      totalVoters: voters.length,
      yesVotes: voters.filter(v => v.vote === 'yes').length,
      noVotes: voters.filter(v => v.vote === 'no').length
    };
    
    console.log('Returning voter data:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch poll voters:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch poll voters', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
