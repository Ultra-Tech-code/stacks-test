import { NextResponse } from 'next/server';

// Cache for address balances (keyed by address)
const balanceCache = new Map<string, { data: any; timestamp: number }>();
const BALANCE_CACHE_TTL = 10000; // 10 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const now = Date.now();
    const cached = balanceCache.get(address);
    if (cached && (now - cached.timestamp) < BALANCE_CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Fetch from Hiro API
    const response = await fetch(
      `https://api.hiro.so/extended/v1/address/${address}/balances`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Update cache
    balanceCache.set(address, {
      data: {
        stxBalance: parseInt(data.stx.balance) / 1000000, // Convert microSTX to STX
      },
      timestamp: now,
    });

    return NextResponse.json(balanceCache.get(address)!.data);
  } catch (error) {
    console.error('Error fetching address balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address balance' },
      { status: 500 }
    );
  }
}
