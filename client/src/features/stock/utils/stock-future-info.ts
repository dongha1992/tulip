import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import type { CompanyFactsResponse } from '../types';

export type FutureChecklistKey =
  | 'earningsVsSavings'
  | 'highGrowthEarnings'
  | 'highGrowthRevenue'
  | 'futureRoe';

export type FutureChecklistItem = {
  key: FutureChecklistKey;
  label: string;
  pass: boolean;
  detail?: string;
};

export type FutureChecklistResult = {
  score: number;
  items: FutureChecklistItem[];
  asOf?: string;

  // debug / UI
  earningsGrowth?: number; //  "이익 성장률"
  epsGrowth?: number; //  "EPS 성장률"
  revenueGrowth?: number; //  매출 성장률
  forwardRoe?: number; //  미래 ROE 근사

  usedEarningsGrowth?: {
    value: number;
    source: 'earningsGrowth' | 'epsGrowth';
  };
};

function pickTrendRow(yahoo: QuoteSummaryResult, period: string) {
  return (
    (yahoo.earningsTrend?.trend ?? []).find((x) => x.period === period) ?? null
  );
}

function pickForwardEpsAvg(
  yahoo: QuoteSummaryResult,
  period: string,
): number | undefined {
  const row = pickTrendRow(yahoo, period);
  const v = row?.earningsEstimate?.avg;
  return typeof v === 'number' ? v : undefined;
}

/** "향후 3년이 전부 적자(EPS<=0)"*/
function allEpsNonPositiveWithin3y(yahoo: QuoteSummaryResult): boolean {
  const eps1 = pickForwardEpsAvg(yahoo, '+1y');
  const eps2 = pickForwardEpsAvg(yahoo, '+2y');
  const eps3 = pickForwardEpsAvg(yahoo, '+3y');

  const arr = [eps1, eps2, eps3].filter(
    (x): x is number => typeof x === 'number',
  );
  if (arr.length === 0) return false; // 데이터 없으면 "전부 적자" 확정 못하니 false

  return arr.every((x) => x <= 0);
}

function pickTrendRowByPriority(yahoo: QuoteSummaryResult, periods: string[]) {
  const t = yahoo.earningsTrend?.trend ?? [];
  for (const p of periods) {
    const row = t.find((x) => x.period === p);
    if (row) return row;
  }
  return null;
}

function hasPositiveEpsWithin3y(yahoo: QuoteSummaryResult): boolean {
  const eps1 = pickForwardEpsAvg(yahoo, '+1y');
  const eps2 = pickForwardEpsAvg(yahoo, '+2y');
  const eps3 = pickForwardEpsAvg(yahoo, '+3y');

  // 데이터가 하나라도 있으면 그걸로 판단 (전부 없으면 false)
  const arr = [eps1, eps2, eps3].filter(
    (x): x is number => typeof x === 'number',
  );
  if (arr.length === 0) return false;

  return arr.some((x) => x > 0);
}

function pickForwardEarningsGrowth(
  yahoo: QuoteSummaryResult,
): number | undefined {
  const row = pickTrendRowByPriority(yahoo, ['+5y', '+1y', '0y']);

  const g1 = row?.growth;
  if (typeof g1 === 'number') return g1;

  const g2 = row?.earningsEstimate?.growth;
  return typeof g2 === 'number' ? g2 : undefined;
}

function pickForwardEpsGrowth(yahoo: QuoteSummaryResult): number | undefined {
  const row = pickTrendRowByPriority(yahoo, ['+5y', '+1y', '0y']);

  const current = row?.epsTrend?.current;
  const yearAgo = row?.earningsEstimate?.yearAgoEps;

  if (
    typeof current === 'number' &&
    typeof yearAgo === 'number' &&
    yearAgo !== 0
  ) {
    return (current - yearAgo) / Math.abs(yearAgo);
  }

  const g = row?.earningsEstimate?.growth;
  return typeof g === 'number' ? g : undefined;
}

/**
 *  매출 성장률: revenueEstimate.growth
 */
function pickForwardRevenueGrowth(
  yahoo: QuoteSummaryResult,
): number | undefined {
  const row = pickTrendRow(yahoo, '+1y') ?? pickTrendRow(yahoo, '0y');
  const g = row?.revenueEstimate?.growth;
  return typeof g === 'number' ? g : undefined;
}

function computeFutureRoeYahooStyle(
  yahoo: QuoteSummaryResult,
  earningsGrowth?: number,
): number | undefined {
  const currentRoe = yahoo.financialData?.returnOnEquity;

  if (typeof currentRoe === 'number' && typeof earningsGrowth === 'number') {
    const g = earningsGrowth > 1 ? earningsGrowth / 100 : earningsGrowth;
    return currentRoe * (1 + g);
  }

  return undefined;
}

export function computeFutureChecklistStyle(
  sec: CompanyFactsResponse,
  yahoo: QuoteSummaryResult,
  opts?: {
    savingsRate?: number; // default 3%
    highGrowthThreshold?: number; // default 20%
    roeThreshold?: number; // default 20%
  },
): FutureChecklistResult {
  let asOf: string | undefined;

  const trend = yahoo.earningsTrend?.trend;
  if (trend?.length && trend[0].endDate) {
    asOf = trend[0].endDate.toISOString().slice(0, 10);
  } else if (yahoo.financialData?.mostRecentQuarter) {
    asOf = (yahoo.financialData.mostRecentQuarter as string).slice(0, 10);
  }

  const savingsRate = opts?.savingsRate ?? 0.03;
  const highGrowthThreshold = opts?.highGrowthThreshold ?? 0.2;
  const roeThreshold = opts?.roeThreshold ?? 0.2;

  const earningsGrowth = pickForwardEarningsGrowth(yahoo); // 있으면 쓰고
  const epsGrowth = pickForwardEpsGrowth(yahoo); // 없으면 이걸로 폴백

  const used =
    typeof earningsGrowth === 'number'
      ? { value: earningsGrowth, source: 'earningsGrowth' as const }
      : typeof epsGrowth === 'number'
        ? { value: epsGrowth, source: 'epsGrowth' as const }
        : undefined;

  const earningsGrowthForPass = used?.value;

  const revenueGrowth = pickForwardRevenueGrowth(yahoo);

  const lossFor3y = allEpsNonPositiveWithin3y(yahoo);

  const profitableSoon = hasPositiveEpsWithin3y(yahoo);

  const forwardRoe = computeFutureRoeYahooStyle(yahoo, earningsGrowthForPass);

  function normGrowth(x?: number): number | undefined {
    if (typeof x !== 'number' || !Number.isFinite(x)) return undefined;
    // 25.1(%) 같은 경우를 0.251로 보정
    return x > 1 ? x / 100 : x;
  }

  const eg = normGrowth(earningsGrowth);
  const epg = normGrowth(epsGrowth);

  //PASS판단에 쓸 성장률: 둘 중 큰 값
  const growthForPass =
    eg != null && epg != null ? Math.max(eg, epg) : (eg ?? epg);

  // (옵션) 어떤 값을 사용했는지 디버그/디테일용
  const usedGrowthSource: 'earningsGrowth' | 'epsGrowth' | 'none' =
    growthForPass == null
      ? 'none'
      : eg != null && growthForPass === eg
        ? 'earningsGrowth'
        : 'epsGrowth';

  const highGrowthEarningsPass =
    !lossFor3y &&
    profitableSoon &&
    growthForPass != null &&
    growthForPass > highGrowthThreshold;

  const earningsVsSavingsPass =
    !lossFor3y &&
    profitableSoon &&
    growthForPass != null &&
    growthForPass > savingsRate;

  const highGrowthRevenuePass =
    revenueGrowth != null && revenueGrowth > highGrowthThreshold;

  const futureRoePass = forwardRoe != null && forwardRoe > roeThreshold;

  const items: FutureChecklistItem[] = [
    {
      key: 'highGrowthEarnings',
      label: '고성장 수익',
      pass: !!highGrowthEarningsPass,
      detail: lossFor3y
        ? `향후 3년 EPS≤0`
        : growthForPass != null
          ? `성장률 ${(growthForPass * 100).toFixed(2)}% (사용: ${usedGrowthSource})`
          : '데이터 부족',
    },
    {
      key: 'highGrowthRevenue',
      label: '고성장 매출',
      pass: !!highGrowthRevenuePass,
      detail:
        revenueGrowth != null
          ? `매출 성장률 ${(revenueGrowth * 100).toFixed(2)}%`
          : '데이터 부족',
    },
    {
      key: 'earningsVsSavings',
      label: '수입 대 저축률',
      pass: !!earningsVsSavingsPass,
      detail: lossFor3y
        ? `향후 3년 EPS≤0`
        : earningsGrowthForPass != null
          ? `성장률 ${(earningsGrowthForPass * 100).toFixed(2)}% vs 저축 ${(savingsRate * 100).toFixed(1)}%` +
            (earningsGrowth == null ? ` (EPS 대체)` : ``)
          : '데이터 부족',
    },
    {
      key: 'futureRoe',
      label: '미래 ROE',
      pass: !!futureRoePass,
      detail:
        forwardRoe != null
          ? `Forward ROE ${(forwardRoe * 100).toFixed(2)}%`
          : 'Equity 또는 Forward NI 부족',
    },
  ];

  const score = items.reduce((s, it) => s + (it.pass ? 1 : 0), 0);

  return {
    score,
    items,
    epsGrowth,
    revenueGrowth,
    forwardRoe,
    asOf,
    usedEarningsGrowth: used,
  };
}
