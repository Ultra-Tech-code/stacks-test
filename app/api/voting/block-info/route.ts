import { NextResponse } from 'next/server';

// Cache for block info (shorter TTL since blocks change frequently)
let blockInfoCache: { data: any; timestamp: number } | null = null;
const BLOCK_INFO_CACHE_TTL = 5000; // 5 seconds

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (blockInfoCache && (now - blockInfoCache.timestamp) < BLOCK_INFO_CACHE_TTL) {
      return NextResponse.json(blockInfoCache.data);
    }

    // Fetch from Hiro API
    const response = await fetch('https://api.hiro.so/v2/info', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hiro API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('🔗 Hiro API Response:', {
      stacks_tip_height: data.stacks_tip_height,
      burn_block_height: data.burn_block_height,
    });
    
    // Update cache
    blockInfoCache = {
      data: {
        stacksTipHeight: data.stacks_tip_height,
        burnBlockHeight: data.burn_block_height,
      },
      timestamp: now,
    };

    console.log('✅ Block Info Cache Updated:', blockInfoCache.data);

    return NextResponse.json(blockInfoCache.data);
  } catch (error) {
    console.error('Error fetching block info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch block info' },
      { status: 500 }
    );
  }
}
