import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import type { CompanyFactsResponse, SecFactItem } from '../types';
import {
    filterByForms,
    filterByFp,
    isAnnualLike,
    parseDate,
    pickUnitSeriesWithCurrencyFallback,
} from './stock-past-info';

// ---------- helpers ----------
function sortByEnd(items: SecFactItem[]) {
  return [...items].sort((a, b) => parseDate(a.end) - parseDate(b.end));
}

/**
 * Balance sheet 계정은 "시점값"이라 FY/Q 구분이 엄격하지 않음.
 * Simply는 최신 10-Q(분기)까지 포함하므로 forms 우선순위로 최신 end를 잡는다.
 */
const BALANCE_SHEET_FORMS = [
  '10-Q',
  '10-Q/A',
  '10-K',
  '10-K/A',
  '20-F',
  '20-F/A',
  '40-F',
  '6-K',
] as const;

function pickBalanceSheetSeries(items: SecFactItem[]): SecFactItem[] {
  const byForm = filterByForms(items, [...BALANCE_SHEET_FORMS]);
  if (byForm.length) return sortByEnd(byForm);

  const annualLike = items.filter(isAnnualLike);
  if (annualLike.length) return sortByEnd(annualLike);

  return sortByEnd(items);
}

function pickLatestEnd(items: SecFactItem[]): string | undefined {
  const s = pickBalanceSheetSeries(items);
  return s.length ? s[s.length - 1].end : undefined;
}

function pickValueAsOf(items: SecFactItem[], end: string): number | undefined {
  const s = pickBalanceSheetSeries(items);
  if (!s.length) return undefined;

  const t = parseDate(end);
  const asOf = s.filter((x) => parseDate(x.end) <= t);
  const pick = (asOf.length ? asOf[asOf.length - 1] : s[s.length - 1]) ?? null;
  return pick?.val;
}

function isQuarterLike(it: SecFactItem): boolean {
  if (!it.start) return false;
  const ms = parseDate(it.end) - parseDate(it.start);
  const days = ms / (24 * 60 * 60 * 1000);
  return days >= 80 && days <= 120;
}

/**
 * TTM: 최근 4개 분기 합산 (10-Q 우선, 없으면 duration 기반 quarter-like)
 * - income statement 항목(EBIT, Net interest 등)에 사용
 */
function computeTTM(items: SecFactItem[]): { end: string; val: number } | null {
  const sorted = sortByEnd(items);

  // 1) 10-Q 기반 분기 4개
  const q10q = sorted.filter(
    (x) => x.start && ['10-Q', '10-Q/A'].includes(String(x.form)),
  );
  if (q10q.length >= 4) {
    const last4 = q10q.slice(-4);
    return {
      end: last4[last4.length - 1].end,
      val: last4.reduce((s, x) => s + x.val, 0),
    };
  }

  // 2) duration으로 quarter-like 4개
  const qLike = sorted.filter((x) => x.start && isQuarterLike(x));
  if (qLike.length >= 4) {
    const last4 = qLike.slice(-4);
    return {
      end: last4[last4.length - 1].end,
      val: last4.reduce((s, x) => s + x.val, 0),
    };
  }

  // 3) FY fallback (annual-like)
  const fy = sorted.filter((x) => x.fp === 'FY' && x.start);
  if (fy.length) {
    const last = fy[fy.length - 1];
    return { end: last.end, val: last.val };
  }

  const annualLike = sorted.filter(isAnnualLike);
  if (annualLike.length) {
    const last = annualLike[annualLike.length - 1];
    return { end: last.end, val: last.val };
  }

  return null;
}

export function fmtMoney(x?: number) {
  if (x == null || !Number.isFinite(x)) return 'n/a';
  const abs = Math.abs(x);
  if (abs >= 1e12) return `${(x / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(x / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(x / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(x / 1e3).toFixed(2)}K`;
  return `${x.toFixed(0)}`;
}

// ---------- cross-taxonomy pickers ----------
function pickSeriesBS(
  sec: CompanyFactsResponse,
  concepts: string[],
): SecFactItem[] {
  // 1) us-gaap 우선
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(sec, 'us-gaap', c);
    if (s.length) return s;
  }
  // 2) ifrs-full fallback
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(sec, 'ifrs-full', c);
    if (s.length) return s;
  }
  return [];
}

function pickSeriesIS(
  sec: CompanyFactsResponse,
  concepts: string[],
): SecFactItem[] {
  // income statement도 us-gaap 우선, ifrs-full fallback
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(sec, 'us-gaap', c);
    if (s.length) return s;
  }
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(sec, 'ifrs-full', c);
    if (s.length) return s;
  }
  return [];
}

// ---------- cash / debt ----------
function pickCashPlusSTIAsOf(
  sec: CompanyFactsResponse,
  asOf: string,
): { value?: number; source?: string } {
  // Simply가 가장 자주 쓰는 합산 태그
  const direct = pickSeriesBS(sec, [
    'CashCashEquivalentsAndShortTermInvestments',
  ]);
  const v0 = pickValueAsOf(direct, asOf);
  if (v0 != null && Number.isFinite(v0))
    return { value: v0, source: 'Cash+STI direct' };

  // cash only fallback
  const cashOnly = pickSeriesBS(sec, [
    'CashAndCashEquivalentsAtCarryingValue',
    'CashAndCashEquivalents',
  ]);
  const v1 = pickValueAsOf(cashOnly, asOf);
  if (v1 != null && Number.isFinite(v1))
    return { value: v1, source: 'Cash only' };

  return { value: undefined, source: 'n/a' };
}
function pickTotalDebtAsOf(
  sec: CompanyFactsResponse,
  asOf: string,
  capHint?: number, // totalLiabilities 같은 상한 힌트(선택)
): { debt?: number; source?: string } {
  const tryPick = (taxonomy: 'us-gaap' | 'ifrs-full', concept: string) => {
    const s = pickUnitSeriesWithCurrencyFallback(sec, taxonomy, concept);
    const v = pickValueAsOf(s, asOf);
    return v != null && Number.isFinite(v) ? v : undefined;
  };

  // 1) 고정 후보 (빠른 경로)
  const fixed: Array<{ t: 'us-gaap' | 'ifrs-full'; c: string }> = [
    { t: 'us-gaap', c: 'Debt' },
    { t: 'us-gaap', c: 'LongTermDebtAndCapitalLeaseObligations' },
    { t: 'us-gaap', c: 'LongTermDebtAndFinanceLeaseLiabilities' },
    { t: 'us-gaap', c: 'LongTermDebt' },
    { t: 'us-gaap', c: 'DebtNoncurrent' },
    { t: 'us-gaap', c: 'DebtCurrent' },
    { t: 'us-gaap', c: 'NotesPayable' },
    { t: 'us-gaap', c: 'ConvertibleDebt' },
    { t: 'ifrs-full', c: 'Borrowings' },
    { t: 'ifrs-full', c: 'BorrowingsCurrent' },
    { t: 'ifrs-full', c: 'BorrowingsNoncurrent' },
  ];

  for (const { t, c } of fixed) {
    const v = tryPick(t, c);
    if (v != null) return { debt: Math.abs(v), source: `${t}:${c}` };
  }

  // 2) 조합 (둘 다 있을 때만 합산)
  const combos: Array<{
    t: 'us-gaap' | 'ifrs-full';
    a: string;
    b: string;
    label: string;
  }> = [
    {
      t: 'us-gaap',
      a: 'DebtCurrent',
      b: 'DebtNoncurrent',
      label: 'DebtCurrent+DebtNoncurrent',
    },
    {
      t: 'us-gaap',
      a: 'LongTermDebtAndCapitalLeaseObligationsCurrent',
      b: 'LongTermDebtAndCapitalLeaseObligationsNoncurrent',
      label: 'LTD+Lease Cur+Noncur',
    },
    {
      t: 'us-gaap',
      a: 'LongTermDebtAndFinanceLeaseLiabilitiesCurrent',
      b: 'LongTermDebtAndFinanceLeaseLiabilitiesNoncurrent',
      label: 'LTD+FinanceLease Cur+Noncur',
    },
    {
      t: 'ifrs-full',
      a: 'BorrowingsCurrent',
      b: 'BorrowingsNoncurrent',
      label: 'Borrowings Cur+Noncur',
    },
  ];

  for (const { t, a, b, label } of combos) {
    const va = tryPick(t, a);
    const vb = tryPick(t, b);
    if (va != null && vb != null) {
      return { debt: Math.abs(va) + Math.abs(vb), source: `${t}:${label}` };
    }
  }

  // 3) ✅ 자동 탐색 (SEC facts에 실제 존재하는 debt 계정들 스캔)
  const debtNameRe =
    /(Debt|Borrow|Borrowings|NotesPayable|NotePayable|Convertible|Loan|CreditFacility|TermLoan|SeniorNotes|LeaseObligation|CapitalLease|FinanceLease)/i;

  // 투자/유가증권(채권투자) 계정은 제외
  const excludeRe =
    /(DebtSecurities|DebtSecurity|DebtInstrument|DebtMaturity|AvailableForSale|TradingSecurities|MarketableSecurities)/i;

  const candidates: Array<{
    taxonomy: 'us-gaap' | 'ifrs-full';
    concept: string;
    val: number;
  }> = [];

  for (const taxonomy of ['us-gaap', 'ifrs-full'] as const) {
    const conceptsObj = sec.facts?.[taxonomy];
    if (!conceptsObj) continue;

    for (const concept of Object.keys(conceptsObj)) {
      if (!debtNameRe.test(concept)) continue;
      if (excludeRe.test(concept)) continue;

      const v = tryPick(taxonomy, concept);
      if (v == null) continue;

      const abs = Math.abs(v);
      if (!(abs > 0)) continue;

      // capHint가 있으면 "터무니없이 큰 값"은 제외 (정확도 방어)
      if (capHint != null && Number.isFinite(capHint) && abs > capHint * 2)
        continue;

      candidates.push({ taxonomy, concept, val: abs });
    }
  }

  if (!candidates.length) return { debt: undefined, source: 'n/a' };

  // 가장 큰 값을 Debt로 채택 (대부분 Total Debt가 가장 큼)
  candidates.sort((a, b) => a.val - b.val);
  const best = candidates[candidates.length - 1];
  return { debt: best.val, source: `${best.taxonomy}:${best.concept}` };
}

// ---------- types ----------
export type FinancialHealthKey =
  | 'shortTerm'
  | 'longTerm'
  | 'debtLevel' // net debt / equity
  | 'debtDown5y'
  | 'interestCoverage';

export type FinancialHealthItem = {
  key: FinancialHealthKey;
  label: string;
  pass: boolean;
  detail?: string;
};

export type FinancialHealthResult = {
  score: number;
  items: FinancialHealthItem[];
  asOf?: string;

  // ✅ 너가 원하는 3개 (Simply처럼)
  keyFacts: {
    debtToEquityPct?: number; // Debt / Equity (167.13%)
    debt?: number; // Debt (971.02m)
    interestCoverageX?: number; // -7.4x
    netDebtToEquityPct?: number; // net debt / equity (58.7%)
    cash?: number; // cash (629.74m)
    equity?: number; // equity (1.65b)
    totalLiabilities?: number; // total liabilities (1.65b)
    totalAssets?: number; // total assets (1.65b)
  };

  // debug
  currentAssets?: number;
  currentLiabilities?: number;
  nonCurrentAssets?: number;
  nonCurrentLiabilities?: number;
};

export function computeFinancialHealthChecklist(
  sec: CompanyFactsResponse,
  opts?: {
    yahoo?: QuoteSummaryResult | null;
    netDebtToEquityThreshold?: number; // default 0.4
    interestCoverageThreshold?: number; // default 2.0
  },
): FinancialHealthResult {
  const yahoo = opts?.yahoo ?? null;
  const netDebtToEquityThreshold = opts?.netDebtToEquityThreshold ?? 0.4;
  const interestCoverageThreshold = opts?.interestCoverageThreshold ?? 2.0;

  // ---- BS series ----
  const assets = pickSeriesBS(sec, ['Assets']);
  const liabilities = pickSeriesBS(sec, ['Liabilities']);
  const equitySeries = pickSeriesBS(sec, [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
    'Equity',
    'EquityAttributableToOwnersOfParent',
  ]);

  const assetsCurrent = pickSeriesBS(sec, ['AssetsCurrent']);
  const liabilitiesCurrent = pickSeriesBS(sec, ['LiabilitiesCurrent']);
  const liabilitiesNonCurrent = pickSeriesBS(sec, ['LiabilitiesNoncurrent']);

  // ---- asOf: 최신 분기까지 ----
  const asOf =
    pickLatestEnd(assetsCurrent) ??
    pickLatestEnd(liabilitiesCurrent) ??
    pickLatestEnd(equitySeries) ??
    pickLatestEnd(assets) ??
    pickLatestEnd(liabilities);

  // ---- BS values ----
  let totalAssets = asOf ? pickValueAsOf(assets, asOf) : undefined;
  let totalLiabilities = asOf ? pickValueAsOf(liabilities, asOf) : undefined;
  let equity = asOf ? pickValueAsOf(equitySeries, asOf) : undefined;

  const ca = asOf ? pickValueAsOf(assetsCurrent, asOf) : undefined;
  const cl = asOf ? pickValueAsOf(liabilitiesCurrent, asOf) : undefined;
  const ncl = asOf ? pickValueAsOf(liabilitiesNonCurrent, asOf) : undefined;

  const nonCurrentAssets =
    totalAssets != null && ca != null ? totalAssets - ca : undefined;

  // ---- cash / debt ----
  const cashPack = asOf ? pickCashPlusSTIAsOf(sec, asOf) : { value: undefined };
  let cash = cashPack.value;

  const debtPack = asOf
    ? pickTotalDebtAsOf(sec, asOf, totalLiabilities)
    : { debt: undefined };
  let debt = debtPack.debt;

  // ---- Interest coverage (TTM EBIT / TTM NetInterest 우선) ----
  // Simply가 -7.4x 같은 음수 표기를 하는 경우가 있어서 "net interest"를 우선
  const ebitLikeSeries = pickSeriesIS(sec, [
    'EarningsBeforeInterestAndTaxes',
    'EBIT',
    'OperatingIncomeLoss',
  ]);

  // ✅ Net interest 후보 더 확장 (Simply가 이 계열을 쓰는 경우 많음)
  const netInterestSeries = pickSeriesIS(sec, [
    'InterestIncomeExpenseNet',
    'InterestIncomeExpenseNonoperatingNet',
    'InterestIncomeExpenseNetNonoperating',
    'InterestIncomeExpenseNetOfHedgingActivities',
  ]);

  // ✅ expense 후보도 유지
  const interestExpenseSeries = pickSeriesIS(sec, [
    'InterestExpense',
    'InterestExpenseNonoperating',
    'InterestAndDebtExpense',
  ]);

  let interestCoverageX: number | undefined;

  if (ebitLikeSeries.length) {
    const ebitTTM = computeTTM(ebitLikeSeries);
    const netIntTTM = netInterestSeries.length
      ? computeTTM(netInterestSeries)
      : null;
    const intExpTTM = interestExpenseSeries.length
      ? computeTTM(interestExpenseSeries)
      : null;

    const denom =
      netIntTTM?.val != null && netIntTTM.val !== 0
        ? netIntTTM.val
        : intExpTTM?.val != null && intExpTTM.val !== 0
          ? intExpTTM.val
          : undefined;

    if (ebitTTM?.val != null && denom != null) {
      // ✅ abs 금지: Simply처럼 -7.4x 같은 부호를 살린다
      interestCoverageX = ebitTTM.val / denom;
    }
  }

  // ---- Yahoo Finance 보정 (가능하면 Simply 스타일에 더 가깝게) ----
  const getNum = (v: unknown): number | undefined => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (
      v &&
      typeof v === 'object' &&
      'raw' in (v as { raw?: unknown }) &&
      typeof (v as { raw?: unknown }).raw === 'number' &&
      Number.isFinite((v as { raw: number }).raw)
    ) {
      return (v as { raw: number }).raw;
    }
    return undefined;
  };

  if (yahoo) {
    const fd = yahoo.financialData as unknown as Record<string, unknown> | null;
    const bsHist = yahoo.balanceSheetHistoryQuarterly as unknown as {
      balanceSheetStatements?: Array<Record<string, unknown>>;
    } | null;
    const bsq = bsHist?.balanceSheetStatements?.[0] ?? null;

    const yTotalDebt =
      getNum(fd?.totalDebt) ??
      getNum(bsq?.totalDebt) ??
      getNum(bsq?.shortLongTermDebtTotal);
    const yCash =
      getNum(fd?.totalCash) ??
      getNum(bsq?.cashAndShortTermInvestments) ??
      getNum(bsq?.cash);
    const yTotalAssets = getNum(bsq?.totalAssets);
    const yTotalLiab = getNum(bsq?.totalLiab);

    if (yTotalDebt != null) debt = yTotalDebt;
    if (yCash != null) cash = yCash;
    if (yTotalAssets != null) totalAssets = yTotalAssets;
    if (yTotalLiab != null) totalLiabilities = yTotalLiab;

    // Equity는 자산-부채로 재계산 시도
    const yEquity =
      yTotalAssets != null && yTotalLiab != null
        ? yTotalAssets - yTotalLiab
        : undefined;
    if (yEquity != null) equity = yEquity;

    // SEC 기반 interestCoverageX가 없으면 Yahoo 기반 fallback
    if (interestCoverageX == null) {
      // 1차: financialData 기반 (EBITDA/EBIT/OperatingIncome / interestExpense)
      const yEbit =
        getNum(fd?.ebitda) ?? getNum(fd?.ebit) ?? getNum(fd?.operatingIncome);
      const yInterestExp = getNum(fd?.interestExpense);
      if (yEbit != null && yInterestExp != null && yInterestExp !== 0) {
        interestCoverageX = yEbit / yInterestExp;
      }
    }

    if (interestCoverageX == null) {
      // 2차: incomeStatementHistoryQuarterly 기반 TTM (최근 4개 분기)
      const ishHistWrap = yahoo.incomeStatementHistoryQuarterly as unknown as {
        incomeStatementHistory?: Array<Record<string, unknown>>;
      } | null;
      const ish = ishHistWrap?.incomeStatementHistory ?? [];

      if (ish.length) {
        const last4 = ish.slice(-4);
        let sumEbit = 0;
        let sumIntExp = 0;
        let haveEbit = false;
        let haveInt = false;

        for (const row of last4) {
          const ebitQ =
            getNum((row as Record<string, unknown>).ebit) ??
            getNum((row as Record<string, unknown>).operatingIncome) ??
            undefined;
          const intQ = getNum((row as Record<string, unknown>).interestExpense);

          if (ebitQ != null) {
            sumEbit += ebitQ;
            haveEbit = true;
          }
          if (intQ != null) {
            sumIntExp += intQ;
            haveInt = true;
          }
        }

        if (haveEbit && haveInt && sumIntExp !== 0) {
          interestCoverageX = sumEbit / sumIntExp;
        }
      }
    }
  }

  // ✅ Simply의 “부채/자본 비율” = Debt / Equity
  const debtToEquityPct =
    equity != null && equity !== 0 && debt != null ? debt / equity : undefined;

  // ✅ “부채 수준”은 netDebt/equity로 판단(체크리스트용)
  const netDebtToEquityPct =
    equity != null && equity !== 0 && debt != null && cash != null
      ? (debt - cash) / equity
      : undefined;

  // ---- debt down 5y: liabilities trend (연간만) ----
  // (그대로 유지하고 싶으면 유지. 지금 질문은 3개 keyFacts라 여긴 체크리스트용)
  const pickAnnualSeriesForTrend = (items: SecFactItem[]) => {
    const fy = filterByFp(
      filterByForms(items, ['10-K', '10-K/A', '20-F', '20-F/A', '40-F']),
      ['FY'],
    );
    if (fy.length) return sortByEnd(fy);

    const annualLike = items.filter(isAnnualLike);
    return sortByEnd(annualLike);
  };

  function pickPastAnnualNearYears(
    items: SecFactItem[],
    latestEnd: string,
    targetYears: number,
  ) {
    const annual = pickAnnualSeriesForTrend(items);
    if (!annual.length) return null;
    const latestT = parseDate(latestEnd);
    const candidates = annual
      .filter((x) => parseDate(x.end) < latestT)
      .filter(
        (x) =>
          (parseDate(latestEnd) - parseDate(x.end)) / (365.25 * 86400_000) >=
          targetYears,
      );
    if (!candidates.length) return null;
    return candidates[candidates.length - 1];
  }

  let liab5yAgo: number | undefined;
  let debtDown5yPass = false;
  let debtToEquity5yAgo: number | undefined;
  if (asOf && liabilities.length) {
    const pastLiab5 = pickPastAnnualNearYears(liabilities, asOf, 5);
    const pastEq5 = equitySeries.length
      ? pickPastAnnualNearYears(equitySeries, asOf, 5)
      : null;

    if (pastLiab5) {
      liab5yAgo = pastLiab5.val;
      if (totalLiabilities != null) {
        // 1차: 총부채 자체가 줄었는지
        debtDown5yPass = totalLiabilities < pastLiab5.val;
      }
    }

    // 2차: 부채/자본 비율이 과거보다 충분히 내려왔는지 (레퍼런스 사이트 스타일)
    const currentDe =
      equity != null && equity !== 0 && totalLiabilities != null
        ? totalLiabilities / equity
        : debtToEquityPct;
    if (pastLiab5 && pastEq5 && pastEq5.val !== 0) {
      debtToEquity5yAgo = pastLiab5.val / pastEq5.val;
    }

    if (
      currentDe != null &&
      debtToEquity5yAgo != null &&
      Number.isFinite(currentDe) &&
      Number.isFinite(debtToEquity5yAgo)
    ) {
      // 현재 D/E가 과거보다 의미 있게 낮으면 "부채 감소"로 간주
      if (currentDe < debtToEquity5yAgo * 0.9) {
        debtDown5yPass = true;
      }
    }
  }

  // ---- checklist ----
  const shortTermPass = ca != null && cl != null ? ca > cl : false;

  // 장기부채 판단용: SEC 비유동부채가 없으면 총부채-단기부채로 근사
  const approxNcl =
    ncl != null
      ? ncl
      : totalLiabilities != null && cl != null
        ? totalLiabilities - cl
        : undefined;

  // 레퍼런스 사이트는 "단기 자산이 장기 부채를 초과" 기준을 많이 사용
  const longTermPass =
    approxNcl != null && ca != null
      ? ca > approxNcl
      : nonCurrentAssets != null && approxNcl != null
        ? nonCurrentAssets > approxNcl
        : false;

  const debtLevelPass =
    netDebtToEquityPct != null
      ? netDebtToEquityPct < netDebtToEquityThreshold
      : false;

  const interestCoveragePass =
    interestCoverageX != null
      ? interestCoverageX >= interestCoverageThreshold
      : false;

  const items: FinancialHealthItem[] = [
    {
      key: 'shortTerm',
      label: '단기부채',
      pass: shortTermPass,
      detail:
        ca != null && cl != null
          ? `단기자산 ${fmtMoney(ca)} vs 단기부채 ${fmtMoney(cl)}`
          : '단기자산/단기부채 데이터 부족',
    },
    {
      key: 'longTerm',
      label: '장기 부채',
      pass: longTermPass,
      detail:
        nonCurrentAssets != null && ncl != null
          ? `장기자산 ${fmtMoney(nonCurrentAssets)} vs 장기부채 ${fmtMoney(ncl)}`
          : '장기자산/장기부채 데이터 부족',
    },
    {
      key: 'debtLevel',
      label: '부채 수준',
      pass: debtLevelPass,
      detail:
        netDebtToEquityPct != null
          ? `순부채/자본 ${(netDebtToEquityPct * 100).toFixed(2)}% (기준 < ${(netDebtToEquityThreshold * 100).toFixed(0)}%)`
          : '순부채/자본 계산 불가 (Debt/Cash/Equity 부족)',
    },
    {
      key: 'debtDown5y',
      label: '부채 감소',
      pass: debtDown5yPass,
      detail:
        totalLiabilities != null && liab5yAgo != null
          ? `총부채 ${fmtMoney(liab5yAgo)} → ${fmtMoney(totalLiabilities)} (5Y)`
          : '5Y 비교 데이터 부족',
    },
    {
      key: 'interestCoverage',
      label: '이자보상배율',
      pass: interestCoveragePass,
      detail:
        interestCoverageX != null
          ? `${interestCoverageX.toFixed(1)}x (기준 ≥ ${interestCoverageThreshold.toFixed(1)}x)`
          : 'EBIT/이자(또는 순이자) 데이터 부족',
    },
  ];

  const score = items.reduce((s, it) => s + (it.pass ? 1 : 0), 0);

  return {
    score,
    items,
    asOf: asOf ? asOf.slice(0, 10) : undefined,

    keyFacts: {
      debtToEquityPct,
      netDebtToEquityPct,
      debt,
      interestCoverageX,
      cash,
      equity,
      totalLiabilities,
      totalAssets,
    },

    currentAssets: ca,
    currentLiabilities: cl,
    nonCurrentAssets,
    nonCurrentLiabilities: ncl,
  };
}
