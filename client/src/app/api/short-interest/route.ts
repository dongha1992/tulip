import { checkRateLimit } from '@/utils/rate-limit';
import { NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

const CRAWLER_BASE =
  process.env.CRAWLER_URL?.replace(/\/$/, '') ??
  (isDev ? 'http://127.0.0.1:8080' : '');

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol은 필수입니다. (예: nyse-hims, nasdaq-aapl)' },
        { status: 400 },
      );
    }

    if (!CRAWLER_BASE) {
      return NextResponse.json(
        { error: 'CRAWLER_URL must be configured' },
        { status: 500 },
      );
    }

    const res = await fetch(`${CRAWLER_BASE}/crawl-short-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Crawler failed: ${err}`);
    }

    const data = await res.json();

    // crawler 응답: { status, symbol, row: { updated, fee2, available, rebate3 } }
    return NextResponse.json({
      status: 'success',
      symbol: data.symbol,
      updated: data.row?.updated ?? null,
      fee2: data.row?.fee2 ?? null,
      available: data.row?.available ?? null,
      rebate3: data.row?.rebate3 ?? null,
    });
  } catch (error) {
    console.error('short-interest API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

