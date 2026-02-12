import type { CompanyFactsResponse, SecFactItem } from '../types';
import {
  computeStyleMetrics,
  filterByForms,
  filterByFp,
  formatPct,
  isAnnualLike,
  parseDate,
  pickUnitSeriesWithCurrencyFallback,
} from '../utils/stock-past-info';

export type SummaryDTO = {
  recentUpdateEnd: string; // "2025-09-30"
  revenueTtm?: number; // raw number
  netIncomeTtm?: number;
  netMarginPct: string; // "110.86%"
  roePct: string; // "53.41%"
  revenueCagr5yPct: string; // "94.57%"
  netIncomeCagr5yPct: string; // "13.10%"
  epsCagr5yPct: string; // "21.75%"
  netIncomeGrowth5y?: {
    kind: 'cagr' | 'turnaround' | 'na';
    value?: number; // cagr
    label?: string; // "2015년 흑자전환"
  };

  epsGrowth5y?: {
    kind: 'cagr' | 'turnaround' | 'na';
    value?: number;
    label?: string;
  };
  futureScore?: string; // "2/4"
  futureItems?: {
    key: string;
    label: string;
    pass: boolean;
    detail?: string;
  }[];
};

type GrowthDisplay =
  | { kind: 'pct'; text: string } // "12.34%"
  | { kind: 'turnaround'; text: string; year?: number } // "2019년 흑자전환"
  | { kind: 'na'; text: 'n/a' };

function formatPctOrTurnaround(
  cagr?: number,
  fySeries?: { end: string; val: number }[],
): GrowthDisplay {
  if (typeof cagr === 'number' && Number.isFinite(cagr)) {
    return { kind: 'pct', text: `${(cagr * 100).toFixed(2)}%` };
  }

  if (fySeries && fySeries.length >= 2) {
    // 오래된 -> 최신 순이라고 가정(아래에서 정렬해줌)
    for (let i = 1; i < fySeries.length; i++) {
      const prev = fySeries[i - 1];
      const cur = fySeries[i];
      if (prev.val <= 0 && cur.val > 0) {
        const year = Number(cur.end.slice(0, 4));
        return { kind: 'turnaround', year, text: `${year}년 흑자전환` };
      }
    }
  }

  return { kind: 'na', text: 'n/a' };
}

function toFYSeriesFallbackAnnualLike(items: SecFactItem[]): SecFactItem[] {
  // 1) 10-K/20-F FY 우선
  const fy = filterByFp(
    filterByForms(items, ['10-K', '10-K/A', '20-F', '40-F']),
    ['FY'],
  );
  if (fy.length) return fy;

  // 2) IFRS/ADR: fp/form이 비어도 duration이 1년인 애들(annual-like) 사용
  const annualLike = items.filter(isAnnualLike);
  return annualLike;
}

export function buildSummaryDTO(data: CompanyFactsResponse): SummaryDTO | null {
  const m = computeStyleMetrics(data);
  if (!m) return null;

  // --- (A) NetIncome FY series (turnaround용) ---
  // us-gaap 우선, 없으면 ifrs-full fallback (단위도 통화 fallback)
  const niItems =
    pickUnitSeriesWithCurrencyFallback(data, 'us-gaap', 'NetIncomeLoss', [
      'USD',
    ]) ||
    pickUnitSeriesWithCurrencyFallback(data, 'ifrs-full', 'ProfitLoss', [
      'DKK',
      'EUR',
      'USD',
    ]);

  const niFYItems = toFYSeriesFallbackAnnualLike(niItems ?? []).sort(
    (a, b) => parseDate(a.end) - parseDate(b.end),
  );
  const niFYCompact = niFYItems.map((x) => ({ end: x.end, val: x.val }));

  // --- (B) EPS FY series (turnaround용) ---
  // EPS는 회사마다 태그/단위가 달라서 후보 좀 넓힘
  const epsCandidates = [
    // us-gaap
    { taxonomy: 'us-gaap', concept: 'EarningsPerShareDiluted' },
    { taxonomy: 'us-gaap', concept: 'EarningsPerShareBasic' },
    // ifrs-full
    { taxonomy: 'ifrs-full', concept: 'BasicEarningsLossPerShare' },
    { taxonomy: 'ifrs-full', concept: 'DilutedEarningsLossPerShare' },
  ] as const;

  let epsItems: SecFactItem[] = [];
  for (const c of epsCandidates) {
    const s = pickUnitSeriesWithCurrencyFallback(data, c.taxonomy, c.concept, [
      'USD-per-shares',
      'USD/shares',
      'DKK',
      'EUR',
      'USD',
    ]);
    if (s.length) {
      epsItems = s;
      break;
    }
  }

  const epsFYItems = toFYSeriesFallbackAnnualLike(epsItems).sort(
    (a, b) => parseDate(a.end) - parseDate(b.end),
  );
  const epsFYCompact = epsFYItems.map((x) => ({ end: x.end, val: x.val }));

  // --- (C) 표시 문자열 결정: CAGR 있으면 % / 없으면 흑자전환 ---
  const niDisp = formatPctOrTurnaround(m.netIncomeCagr5y, niFYCompact);
  const epsDisp = formatPctOrTurnaround(m.epsCagr5y, epsFYCompact);

  return {
    recentUpdateEnd: m.recentNetIncomeUpdateEnd,
    revenueTtm: m.ttmRevenue,
    netIncomeTtm: m.ttmNetIncome,
    netMarginPct: formatPct(m.netMargin),
    roePct: formatPct(m.roe),
    revenueCagr5yPct: formatPct(m.revenueCagr5y),

    netIncomeCagr5yPct: niDisp.text,
    epsCagr5yPct: epsDisp.text,
  };
}
