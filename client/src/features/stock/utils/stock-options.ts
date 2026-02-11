import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import { getYahooOptions } from '../queries/get-yahoo-stock-forecast';

export type SimpleOptionRow = {
  strike: number;
  openInterest?: number | null;
  volume?: number | null;
};

type OiWallOptions = {
  bucketSize?: number;
  spot?: number;
  withinPct?: number;
};

type OiAgg = { strike: number; oi: number; vol: number };

function aggregateOiByStrike(
  rows: SimpleOptionRow[],
  opts: OiWallOptions = {},
): OiAgg[] {
  const { bucketSize = 0, spot, withinPct } = opts;

  const inRange = (k: number) => {
    if (spot == null || withinPct == null) return true;
    const lo = spot * (1 - withinPct);
    const hi = spot * (1 + withinPct);
    return k >= lo && k <= hi;
  };

  const bucketKey = (k: number) => {
    if (!bucketSize) return k;
    return Math.round(k / bucketSize) * bucketSize;
  };

  const map = new Map<number, { oi: number; vol: number }>();

  for (const r of rows) {
    const k = r.strike;
    if (!Number.isFinite(k) || !inRange(k)) continue;

    const key = bucketKey(k);
    const oi = Number(r.openInterest ?? 0) || 0;
    const vol = Number(r.volume ?? 0) || 0;

    const prev = map.get(key) ?? { oi: 0, vol: 0 };
    map.set(key, { oi: prev.oi + oi, vol: prev.vol + vol });
  }

  const result: OiAgg[] = [];
  for (const [strike, v] of map.entries()) {
    result.push({ strike, oi: v.oi, vol: v.vol });
  }

  // OI 내림차순, 같은 OI면 스트라이크 오름차순
  result.sort((a, b) => {
    if (b.oi !== a.oi) return b.oi - a.oi;
    return a.strike - b.strike;
  });

  return result;
}

export function pickOiWall(
  rows: SimpleOptionRow[],
  opts: OiWallOptions = {},
): OiAgg | null {
  const all = aggregateOiByStrike(rows, opts);
  return all[0] ?? null;
}

export function pickOiWallTopN(
  rows: SimpleOptionRow[],
  n: number,
  opts: OiWallOptions = {},
): OiAgg[] {
  if (n <= 0) return [];
  const all = aggregateOiByStrike(rows, opts);
  return all.slice(0, n);
}

export function computeMaxPain(
  calls: SimpleOptionRow[],
  puts: SimpleOptionRow[],
): number | null {
  const strikesSet = new Set<number>();
  for (const r of calls) {
    if (Number.isFinite(r.strike)) strikesSet.add(r.strike);
  }
  for (const r of puts) {
    if (Number.isFinite(r.strike)) strikesSet.add(r.strike);
  }

  const strikes = Array.from(strikesSet).sort((a, b) => a - b);
  if (strikes.length === 0) return null;

  let bestStrike: number | null = null;
  let bestPain: number | null = null;

  for (const S of strikes) {
    let pain = 0;

    for (const c of calls) {
      const oi = Number(c.openInterest ?? 0) || 0;
      if (!oi) continue;
      pain += Math.max(0, S - c.strike) * oi;
    }

    for (const p of puts) {
      const oi = Number(p.openInterest ?? 0) || 0;
      if (!oi) continue;
      pain += Math.max(0, p.strike - S) * oi;
    }

    if (bestPain == null || pain < bestPain) {
      bestPain = pain;
      bestStrike = S;
    }
  }

  return bestStrike;
}

export type OptionsSnapshot = {
  spot: number | null;
  expiration: string | null;
  callWalls: { strike: number; oi: number }[];
  putWalls: { strike: number; oi: number }[];
  maxPain: number | null;
};

/**
 * 티커/야후 시세를 받아 옵션 요약 스냅샷을 계산한다.
 */
export async function buildOptionsSnapshot(
  tickerSymbol: string | null,
  yahoo: QuoteSummaryResult | null,
  topN = 3,
): Promise<OptionsSnapshot | null> {
  if (!tickerSymbol || !yahoo) return null;

  const chain = await getYahooOptions(tickerSymbol);
  const first = chain.options?.[0];

  const calls = (first?.calls ?? []) as SimpleOptionRow[];
  const puts = (first?.puts ?? []) as SimpleOptionRow[];

  if (!calls.length && !puts.length) {
    return null;
  }

  const spot =
    (yahoo.price?.regularMarketPrice as number | undefined) ?? null;
  const bucketSize = 1; // 기본 $1 버킷
  const withinPct = 0.3; // 현재가 ±30% 범위

  const callRes = pickOiWallTopN(calls, topN, {
    bucketSize,
    spot: spot ?? undefined,
    withinPct,
  });
  const putRes = pickOiWallTopN(puts, topN, {
    bucketSize,
    spot: spot ?? undefined,
    withinPct,
  });

  const callWalls = callRes.map((w) => ({ strike: w.strike, oi: w.oi }));
  const putWalls = putRes.map((w) => ({ strike: w.strike, oi: w.oi }));

  const maxPain = computeMaxPain(calls, puts);

  const exp =
    first?.expirationDate instanceof Date
      ? first.expirationDate.toISOString().slice(0, 10)
      : typeof first?.expirationDate === 'string'
        ? first.expirationDate.slice(0, 10)
        : null;

  return {
    spot,
    expiration: exp,
    callWalls,
    putWalls,
    maxPain,
  };
}


