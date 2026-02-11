import { checkRateLimit } from '@/utils/rate-limit';
import { NextResponse } from 'next/server';

const isDev = process.env.NODE_ENV === 'development';

const CRAWLER_BASE =
  process.env.CRAWLER_URL?.replace(/\/$/, '') ??
  (isDev ? 'http://127.0.0.1:8080' : '');

type CachedShortInterest = {
  data: {
    status: 'success';
    symbol: string;
    updated: string | null;
    fee2: string | null;
    available: string | null;
    rebate3: string | null;
  };
  fetchedAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30분
const shortInterestCache = new Map<string, CachedShortInterest>();

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
        { error: 'CRAWLER_URL가 설정되지 않았습니다.' },
        { status: 500 },
      );
    }

    // 30분 캐싱: 동일 symbol에 대해 30분 이내 요청이면 캐시 반환
    const now = Date.now();
    const cached = shortInterestCache.get(symbol);
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
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

    const payload = {
      status: 'success',
      symbol: data.symbol,
      updated: data.row?.updated ?? null,
      fee2: data.row?.fee2 ?? null,
      available: data.row?.available ?? null,
      rebate3: data.row?.rebate3 ?? null,
    } as const;

    shortInterestCache.set(symbol, { data: payload, fetchedAt: now });

    return NextResponse.json(payload);
  } catch (error) {
    console.error('short-interest API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
