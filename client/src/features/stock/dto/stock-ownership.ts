import { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import type { OwnershipBreakdownDTO } from '../types';
import {
    clamp01,
    normalizePctMaybe,
    roundShares,
    safeNum,
} from '../utils/stock-ownership';

export function buildOwnershipBreakdownDTO(
  yahoo: QuoteSummaryResult,
): OwnershipBreakdownDTO {
  const sharesOut = safeNum(yahoo.defaultKeyStatistics?.sharesOutstanding);

  const rawInsiders = yahoo.majorHoldersBreakdown?.insidersPercentHeld;
  const rawInst = yahoo.majorHoldersBreakdown?.institutionsPercentHeld;

  const insidersPct = normalizePctMaybe(safeNum(rawInsiders)); // 0~1
  const instPctRaw = normalizePctMaybe(safeNum(rawInst)); // 0~1

  // 기관(표시용) = 기관(원본) - 내부자 (내부자가 기관에 포함된 경우가 흔하므로)
  const instPct =
    instPctRaw != null && insidersPct != null
      ? clamp01(instPctRaw - insidersPct)
      : instPctRaw;

  // 기타/일반(추정): Yahoo만으로 정부 분리는 불가 → "기관(원본)"의 나머지로 처리
  // (이렇게 하면 insiders + inst(adjusted) + other = 100%가 항상 성립)
  const otherPct = instPctRaw != null ? clamp01(1 - instPctRaw) : undefined;

  const insidersShares =
    sharesOut != null && insidersPct != null
      ? roundShares(sharesOut * insidersPct)
      : undefined;

  const instShares =
    sharesOut != null && instPct != null
      ? roundShares(sharesOut * instPct)
      : undefined;

  const otherShares =
    sharesOut != null && otherPct != null
      ? roundShares(sharesOut * otherPct)
      : undefined;

  const asOf =
    (typeof yahoo.financialData?.mostRecentQuarter === 'string'
      ? yahoo.financialData.mostRecentQuarter.slice(0, 10)
      : undefined) ??
    (yahoo.price?.regularMarketTime instanceof Date
      ? yahoo.price.regularMarketTime.toISOString().slice(0, 10)
      : undefined);

  return {
    asOf,
    exchange: yahoo.price?.exchangeName ?? yahoo.price?.exchange,
    symbol: yahoo.price?.symbol ?? yahoo.quoteType?.symbol,

    sharesOutstanding: sharesOut,

    rows: [
      {
        key: 'institutions',
        label: '기관 투자자',
        shares: instShares,
        pct: instPct,
      },
      {
        key: 'insiders',
        label: '개인 내부자',
        shares: insidersShares,
        pct: insidersPct,
      },
      {
        key: 'other',
        label: '정부/공공기관 + 일반(추정)',
        shares: otherShares,
        pct: otherPct,
      },
    ],
  };
}
