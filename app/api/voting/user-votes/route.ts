import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    console.log('Fetching vote events for address:', address);

    // Fetch transactions for the user's address
    const response = await fetch(
      `https://api.testnet.hiro.so/extended/v1/address/${address}/transactions?limit=50`,
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
    console.log('Transactions response:', data);

    // Filter for vote transactions on our contract
    const votedPolls = new Set<number>();
    
    if (data.results) {
      for (const tx of data.results) {
        // Check if it's a contract call to our voting contract
        if (
          tx.tx_type === 'contract_call' &&
          tx.contract_call?.contract_id === 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G.Blackadam-vote-contract' &&
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

    console.log('User voted on polls:', Array.from(votedPolls));

    return NextResponse.json({
      votedPolls: Array.from(votedPolls)
    });
  } catch (error) {
    console.error('Failed to fetch user votes:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user votes', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
