import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pollId } = await request.json();
    
    if (pollId === undefined || pollId === null) {
      return NextResponse.json({ error: 'Poll ID required' }, { status: 400 });
    }

    const contractId = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G.Blackadam-vote-contract';

    // Fetch all transactions for the contract
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${contractId.split('.')[0]}/transactions?limit=200`,
      {
        method: 'GET',
        headers: { 
          'Accept': 'application/json'
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: response.status });
    }

    const data = await response.json();

    interface Voter {
      address: string;
      vote: 'yes' | 'no';
      timestamp: number;
      txId: string;
    }

    const voters: Voter[] = [];
    
    if (data.results) {
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
              
              if (txPollId === pollId) {
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
    }

    // Sort by timestamp (most recent first)
    voters.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      pollId,
      voters,
      totalVoters: voters.length,
      yesVotes: voters.filter(v => v.vote === 'yes').length,
      noVotes: voters.filter(v => v.vote === 'no').length
    });
  } catch (error) {
    console.error('Failed to fetch poll voters:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch poll voters', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
