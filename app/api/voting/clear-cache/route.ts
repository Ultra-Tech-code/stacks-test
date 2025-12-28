import { NextResponse } from 'next/server';
import { clearPollsCache } from '../all-polls/route';

// Cache-busting endpoint to force refresh
export async function POST() {
  try {
    clearPollsCache();
    console.log('✅ Polls cache cleared manually');
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
