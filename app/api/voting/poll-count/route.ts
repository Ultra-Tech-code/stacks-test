import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sender } = await request.json();
    
    const response = await fetch(
      'https://api.testnet.hiro.so/v2/contracts/call-read/ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G/Blackadam-vote-contract/get-poll-count',
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: sender || 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G',
          arguments: [],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('Hiro API error:', response.status, text);
      return NextResponse.json({ error: 'Hiro API error', details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch poll count:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch poll count', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
