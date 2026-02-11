import type { CompanyFactsResponse, SecFactItem } from '../types';

export function parseDate(d: string): number {
  return Date.parse(`${d}T00:00:00Z`);
}

function daysBetween(start: string, end: string): number {
  return (parseDate(end) - parseDate(start)) / (24 * 60 * 60 * 1000);
}

export function isAnnualLike(it: SecFactItem): boolean {
  if (!it.start) return false;
  const d = daysBetween(it.start, it.end);
  return d >= 330 && d <= 400;
}

function isQuarterLike(it: SecFactItem): boolean {
  if (!it.start) return false;
  const d = daysBetween(it.start, it.end);
  return d >= 80 && d <= 120;
}

function pickAnnualAsOf(items: SecFactItem[], end: string): SecFactItem | null {
  const annuals = items
    .filter(isAnnualLike)
    .sort((a, b) => parseDate(a.end) - parseDate(b.end));
  if (!annuals.length) return null;

  const exact = annuals.filter((x) => x.end === end);
  if (exact.length) return exact[exact.length - 1];

  const asOf = annuals.filter((x) => parseDate(x.end) <= parseDate(end));
  return (
    (asOf.length ? asOf[asOf.length - 1] : annuals[annuals.length - 1]) ?? null
  );
}

function normalizeItems(items: SecFactItem[]): SecFactItem[] {
  // 같은 end가 여러 개면 filed 최신만 남김 (정정 공시 대응)
  const byEnd = new Map<string, SecFactItem>();
  for (const it of items) {
    const prev = byEnd.get(it.end);
    if (!prev) {
      byEnd.set(it.end, it);
      continue;
    }
    const prevFiled = prev.filed ? parseDate(prev.filed) : -Infinity;
    const curFiled = it.filed ? parseDate(it.filed) : -Infinity;
    if (curFiled >= prevFiled) byEnd.set(it.end, it);
  }
  return Array.from(byEnd.values()).sort(
    (a, b) => parseDate(a.end) - parseDate(b.end),
  );
}

export function pickUnitSeries(
  data: CompanyFactsResponse,
  taxonomy: string,
  concept: string,
  preferredUnits: string[] = [],
): SecFactItem[] {
  const unitsObj = data.facts?.[taxonomy]?.[concept]?.units ?? undefined;

  if (!unitsObj) return [];

  // preferredUnits 먼저 찾고, 없으면 아무 유닛 1개 선택
  for (const u of preferredUnits) {
    const arr = unitsObj[u];
    if (arr?.length) return normalizeItems(arr);
  }

  const firstKey = Object.keys(unitsObj)[0];
  if (!firstKey) return [];
  return normalizeItems(unitsObj[firstKey] ?? []);
}

const FALLBACK_CURRENCY_UNITS = [
  'USD',
  'DKK',
  'EUR',
  'GBP',
  'JPY',
  'KRW',
  'CHF',
  'SEK',
  'NOK',
  'CAD',
  'AUD',
] as const;

export function pickUnitSeriesWithCurrencyFallback(
  data: CompanyFactsResponse,
  taxonomy: string,
  concept: string,
  preferredUnits: string[] = [],
): SecFactItem[] {
  // 1) preferredUnits 우선
  const s1 = pickUnitSeries(data, taxonomy, concept, preferredUnits);
  if (s1.length) return s1;

  // 2) 통화 fallback (units key 중 하나라도 있으면 채택)
  for (const u of FALLBACK_CURRENCY_UNITS) {
    const s2 = pickUnitSeries(data, taxonomy, concept, [u]);
    if (s2.length) return s2;
  }
  return [];
}

function pickFirstSeriesCrossTaxonomy(
  data: CompanyFactsResponse,
  concepts: string[],
  unitPref: string[],
): { taxonomy: string | null; concept: string | null; series: SecFactItem[] } {
  // us-gaap 우선, 없으면 ifrs-full
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(data, 'us-gaap', c, unitPref);
    if (s.length) return { taxonomy: 'us-gaap', concept: c, series: s };
  }
  for (const c of concepts) {
    const s = pickUnitSeriesWithCurrencyFallback(
      data,
      'ifrs-full',
      c,
      unitPref,
    );
    if (s.length) return { taxonomy: 'ifrs-full', concept: c, series: s };
  }
  return { taxonomy: null, concept: null, series: [] };
}

export function filterByForms(
  items: SecFactItem[],
  forms: string[],
): SecFactItem[] {
  const set = new Set(forms);
  return items.filter((x) => (x.form ? set.has(x.form) : false));
}

export function filterByFp(items: SecFactItem[], fps: string[]): SecFactItem[] {
  const set = new Set(fps);
  return items.filter((x) => (x.fp ? set.has(x.fp) : false));
}

function computeTTM(items: SecFactItem[]): {
  end: string;
  val: number;
  source: 'Q_FP' | 'Q_DURATION' | 'FY' | 'ANNUAL_LIKE' | 'Q_LIKE';
} | null {
  const sorted = [...items].sort((a, b) => parseDate(a.end) - parseDate(b.end));

  // 1️⃣ fp 기준 분기 4개(10-Q) 우선 (기존)
  const qByFp = sorted.filter(
    (x) =>
      ['Q1', 'Q2', 'Q3', 'Q4'].includes(String(x.fp)) &&
      ['10-Q', '10-Q/A'].includes(String(x.form)),
  );

  if (qByFp.length >= 4) {
    const last4 = qByFp.slice(-4);
    return {
      end: last4[last4.length - 1].end,
      val: last4.reduce((s, x) => s + x.val, 0),
      source: 'Q_FP',
    };
  }

  // 2️⃣ duration 기반 분기 4개 fallback (기존)
  const qByDuration = sorted.filter(
    (x) => x.start && ['10-Q', '10-Q/A'].includes(String(x.form)),
  );

  if (qByDuration.length >= 4) {
    const last4 = qByDuration.slice(-4);
    return {
      end: last4[last4.length - 1].end,
      val: last4.reduce((s, x) => s + x.val, 0),
      source: 'Q_DURATION',
    };
  }

  // 3️⃣ FY / 10-K 마지막 fallback (기존)
  const fy = sorted.filter(
    (x) => x.fp === 'FY' && ['10-K', '10-K/A'].includes(String(x.form)),
  );

  if (fy.length) {
    const last = fy[fy.length - 1];
    return { end: last.end, val: last.val, source: 'FY' };
  }

  // ✅ 4️⃣ (ADR/IFRS) 연간처럼 보이는 duration 마지막 값
  const annualLike = sorted.filter(isAnnualLike);
  if (annualLike.length) {
    const last = annualLike[annualLike.length - 1];
    return { end: last.end, val: last.val, source: 'ANNUAL_LIKE' };
  }

  // ✅ 5️⃣ (ADR/IFRS) 분기처럼 보이는 duration 4개 합산
  const quarterLike = sorted.filter(isQuarterLike);
  if (quarterLike.length >= 4) {
    const last4 = quarterLike.slice(-4);
    return {
      end: last4[last4.length - 1].end,
      val: last4.reduce((s, x) => s + x.val, 0),
      source: 'Q_LIKE',
    };
  }

  return null;
}

function pickLatestAnnual(
  items: SecFactItem[],
): { end: string; val: number } | null {
  // 기존: 10-K FY
  const fy = filterByFp(filterByForms(items, ['10-K', '10-K/A']), ['FY']);
  if (fy.length) {
    const last = fy[fy.length - 1];
    return { end: last.end, val: last.val };
  }

  // ✅ 추가: annual-like duration
  const annualLike = [...items]
    .filter(isAnnualLike)
    .sort((a, b) => parseDate(a.end) - parseDate(b.end));
  if (annualLike.length) {
    const last = annualLike[annualLike.length - 1];
    return { end: last.end, val: last.val };
  }

  return null;
}

function yearsBetween(fromEnd: string, toEnd: string): number {
  const diff = parseDate(toEnd) - parseDate(fromEnd);
  return diff / (365.25 * 24 * 60 * 60 * 1000);
}

function cagr(past: number, latest: number, years: number): number | null {
  if (!(years > 0)) return null;
  // CAGR는 음수/0이 섞이면 의미가 깨짐 → 안전하게 n/a
  if (!(past > 0 && latest > 0)) return null;
  return Math.pow(latest / past, 1 / years) - 1;
}

// end가 latestEnd에서 과거로 최소 targetYears 이상 떨어진 관측치 하나 선택
function pickPastValueNearYears(
  items: SecFactItem[],
  latestEnd: string,
  targetYears = 5,
): SecFactItem | null {
  const latestT = parseDate(latestEnd);
  // latestEnd보다 과거인 것들 중에서 targetYears 이상 떨어진 것들 중 "가장 최신"을 선택
  const candidates = items
    .filter((x) => parseDate(x.end) < latestT)
    .filter((x) => yearsBetween(x.end, latestEnd) >= targetYears);

  if (!candidates.length) return null;
  return candidates[candidates.length - 1];
}

// ===== Metric calculators =====
export type TurnaroundInfo =
  | {
      kind: 'cagr';
      value: number; // 0~1
    }
  | {
      kind: 'turnaround';
      year: number; // e.g. 2015
      label: string; // "2015년 흑자전환"
    }
  | {
      kind: 'na';
      reason: string;
    };

export type Metrics = {
  recentNetIncomeUpdateEnd: string;

  ttmRevenue?: number;
  ttmNetIncome?: number;
  netMargin?: number;
  roe?: number;

  revenueCagr5y?: number;
  netIncomeCagr5y?: number;
  epsCagr5y?: number;

  netIncomeGrowth5y?: TurnaroundInfo;
  epsGrowth5y?: TurnaroundInfo;
};

function pickAnnualSeriesForGrowth(
  items: SecFactItem[],
  preferForms = ['10-K', '10-K/A', '20-F', '40-F'],
): SecFactItem[] {
  const byForm = filterByForms(items, preferForms);
  const fy = filterByFp(byForm, ['FY']);
  if (fy.length) return fy;

  // form/fp가 비거나 IFRS/ADR이면 duration 기반 annual-like fallback
  const annualLike = items.filter(isAnnualLike);
  return annualLike.sort((a, b) => parseDate(a.end) - parseDate(b.end));
}

function findTurnaroundYear(
  fySeries: { end: string; val: number }[],
): number | null {
  // fySeries: 오래된 -> 최신 순 정렬되어 있다고 가정
  for (let i = 1; i < fySeries.length; i++) {
    const prev = fySeries[i - 1];
    const cur = fySeries[i];
    // 적자/0 -> 흑자로 전환된 최초 연도
    if (prev.val <= 0 && cur.val > 0) {
      return Number(cur.end.slice(0, 4));
    }
  }
  return null;
}
function buildGrowthInfo(
  series: SecFactItem[],
  latestEnd: string,
  targetYears: number,
): TurnaroundInfo {
  const annual = pickAnnualSeriesForGrowth(series);

  const latest =
    [...annual].filter((x) => x.end === latestEnd).slice(-1)[0] ??
    [...annual]
      .filter((x) => parseDate(x.end) <= parseDate(latestEnd))
      .slice(-1)[0] ??
    annual[annual.length - 1];

  if (!latest) return { kind: 'na', reason: 'latest annual value not found' };

  const past = pickPastValueNearYears(annual, latest.end, targetYears);
  if (!past) {
    // 5Y 포인트가 없으면 turnaround라도 뽑아보기
    const y = findTurnaroundYear(annual);
    if (y) return { kind: 'turnaround', year: y, label: `${y}년 흑자전환` };
    return { kind: 'na', reason: 'no past value near target years' };
  }

  const yrs = yearsBetween(past.end, latest.end);

  const g = cagr(past.val, latest.val, yrs);
  if (g != null) return { kind: 'cagr', value: g };

  // CAGR 막혔으면(과거<=0/최신<=0) → turnaround 시도
  const y = findTurnaroundYear(annual);
  if (y) return { kind: 'turnaround', year: y, label: `${y}년 흑자전환` };

  return {
    kind: 'na',
    reason: `cagr not applicable (past=${past.val}, latest=${latest.val})`,
  };
}

export function computeSimplyStyleMetrics(
  data: CompanyFactsResponse,
): Metrics | null {
  // ---- concept 후보들 ----
  const revenueConcepts = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
    'SalesRevenueGoodsNet',
    'SalesRevenueServicesNet',
  ];

  const epsConcepts = ['EarningsPerShareDiluted', 'EarningsPerShareBasic'];
  const equityConcepts = [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
  ];
  const dilutedSharesConcepts = [
    'WeightedAverageNumberOfDilutedSharesOutstanding',
    'WeightedAverageNumberOfSharesOutstandingDiluted',
  ];
  const basicSharesConcepts = ['WeightedAverageNumberOfSharesOutstandingBasic'];

  const pickFirstSeries = (concepts: string[], unitPref: string[]) => {
    for (const c of concepts) {
      const s = pickUnitSeries(data, 'us-gaap', c, unitPref);
      if (s.length) return { concept: c, series: s };
    }
    return { concept: null as string | null, series: [] as SecFactItem[] };
  };

  // us-gaap 우선, 안되면 ifrs-full
  const revenue = (() => {
    // revenue는 네 기존 pickBestSeriesByTTMSupport를 us-gaap로 먼저 시도
    const us = pickBestSeriesByTTMSupport(data, 'us-gaap', revenueConcepts, [
      'USD',
    ]);
    if (us.series.length)
      return {
        taxonomy: 'us-gaap' as const,
        concept: us.concept,
        series: us.series,
      };

    // ifrs-full fallback: concept 후보가 케바케라 최소한 'Revenue'도 같이 시도 권장
    const ifrsConcepts = [...revenueConcepts, 'Revenue'];
    // pickBestSeriesByTTMSupport 재사용 (taxonomy만 ifrs-full)
    const ifrs = pickBestSeriesByTTMSupport(data, 'ifrs-full', ifrsConcepts, [
      'USD',
      'DKK',
      'EUR',
    ]);
    return {
      taxonomy: 'ifrs-full' as const,
      concept: ifrs.concept,
      series: ifrs.series,
    };
  })();

  const netIncome = (() => {
    // us-gaap 기본
    const us = pickFirstSeriesCrossTaxonomy(data, ['NetIncomeLoss'], ['USD']);
    if (us.series.length) return us;

    // ifrs-full 후보들 추가
    return pickFirstSeriesCrossTaxonomy(
      data,
      ['ProfitLoss', 'ProfitLossAttributableToOwnersOfParent', 'NetIncomeLoss'],
      ['USD', 'DKK', 'EUR'],
    );
  })();

  if (!revenue.series.length || !netIncome.series.length) return null;

  if (!revenue.series.length || !netIncome.series.length) return null;

  // ---- TTM 우선(없으면 연간) ----
  const revTTM = computeTTM(revenue.series);
  const niTTM = computeTTM(netIncome.series);

  let recentEnd: string | null = null;
  let ttmRevenue: number | undefined;
  let ttmNetIncome: number | undefined;

  if (revTTM && niTTM) {
    recentEnd = niTTM.end;
    ttmRevenue = revTTM.val;
    ttmNetIncome = niTTM.val;
  } else {
    // 폴백: 연간(10-K FY)
    const revFY = pickLatestAnnual(revenue.series);
    const niFY = pickLatestAnnual(netIncome.series);
    if (!revFY || !niFY) return null;

    // 기간 end가 다르면 더 최신 end 기준으로 맞추는 게 좋아서 여기선 netIncome end를 기준으로
    recentEnd = niFY.end;
    ttmRevenue = revFY.val;
    ttmNetIncome = niFY.val;
  }

  // ---- 순이익률 ----
  const netMargin =
    ttmRevenue && ttmRevenue !== 0 ? ttmNetIncome! / ttmRevenue : undefined;

  // ---- ROE: TTM NetIncome / AvgEquity ----
  const equity = pickFirstSeriesCrossTaxonomy(
    data,
    [...equityConcepts, 'Equity', 'EquityAttributableToOwnersOfParent'],
    ['USD', 'DKK', 'EUR'],
  );

  let roe: number | undefined;

  if (equity.series.length && recentEnd) {
    // equity는 instantaneous(시점)일 때 start가 없을 수 있음. end만으로 정렬됨.
    const eqSeries = equity.series;
    // recentEnd와 가장 가까운(<= recentEnd) equity
    const eqLatest = [...eqSeries]
      .filter((x) => parseDate(x.end) <= parseDate(recentEnd!))
      .slice(-1)[0];
    const eqPast = eqLatest
      ? pickPastValueNearYears(eqSeries, eqLatest.end, 1)
      : null; // 1년 전 근사
    if (eqLatest && eqPast) {
      const avgEq = (eqLatest.val + eqPast.val) / 2;
      if (avgEq !== 0 && ttmNetIncome != null) roe = ttmNetIncome / avgEq;
    }
  }

  // ---- 5Y CAGR (연간 series가 안정적) ----
  // 매출/순이익은 FY 10-K 기준 series로 계산하는 걸 추천
  const revenueFYSeries = filterByFp(
    filterByForms(revenue.series, ['10-K', '10-K/A']),
    ['FY'],
  );
  const netIncomeFYSeries = filterByFp(
    filterByForms(netIncome.series, ['10-K', '10-K/A']),
    ['FY'],
  );

  const latestRevFY = revenueFYSeries.length
    ? revenueFYSeries[revenueFYSeries.length - 1]
    : null;
  const pastRevFY = latestRevFY
    ? pickPastValueNearYears(revenueFYSeries, latestRevFY.end, 5)
    : null;

  const latestNiFY = netIncomeFYSeries.length
    ? netIncomeFYSeries[netIncomeFYSeries.length - 1]
    : null;
  const pastNiFY = latestNiFY
    ? pickPastValueNearYears(netIncomeFYSeries, latestNiFY.end, 5)
    : null;

  const revenueCagr5y =
    latestRevFY && pastRevFY
      ? (cagr(
          pastRevFY.val,
          latestRevFY.val,
          yearsBetween(pastRevFY.end, latestRevFY.end),
        ) ?? undefined)
      : undefined;

  const netIncomeCagr5y =
    latestNiFY && pastNiFY
      ? (cagr(
          pastNiFY.val,
          latestNiFY.val,
          yearsBetween(pastNiFY.end, latestNiFY.end),
        ) ?? undefined)
      : undefined;

  // ---- EPS CAGR ----
  // 1) EPS 태그 있으면 그걸 FY 기준으로
  // 2) 없으면 EPS = NetIncomeFY / SharesFY 로 계산
  let epsCagr5y: number | undefined;

  const eps = pickFirstSeriesCrossTaxonomy(
    data,
    [
      ...epsConcepts,
      'BasicEarningsLossPerShare',
      'DilutedEarningsLossPerShare',
    ],
    ['USD-per-shares', 'USD/shares', 'USD', 'DKK', 'EUR'],
  );

  const epsFYSeries = eps.series.length
    ? filterByFp(filterByForms(eps.series, ['10-K', '10-K/A']), ['FY'])
    : [];

  if (epsFYSeries.length) {
    const latest = epsFYSeries[epsFYSeries.length - 1];
    const past = pickPastValueNearYears(epsFYSeries, latest.end, 5);
    if (past) {
      epsCagr5y =
        cagr(past.val, latest.val, yearsBetween(past.end, latest.end)) ??
        undefined;
    }
  } else {
    // EPS = NetIncome / Shares (FY)
    const dilutedShares = pickFirstSeries(dilutedSharesConcepts, ['shares']);
    const basicShares = pickFirstSeries(basicSharesConcepts, ['shares']);

    const sharesSeries = dilutedShares.series.length
      ? dilutedShares.series
      : basicShares.series;

    const sharesFYSeries = sharesSeries.length
      ? filterByFp(filterByForms(sharesSeries, ['10-K', '10-K/A']), ['FY'])
      : [];

    if (netIncomeFYSeries.length && sharesFYSeries.length) {
      const latestNi = netIncomeFYSeries[netIncomeFYSeries.length - 1];
      const latestSh =
        [...sharesFYSeries]
          .filter((x) => x.end === latestNi.end)
          .slice(-1)[0] ?? sharesFYSeries[sharesFYSeries.length - 1];

      const pastNi = pickPastValueNearYears(netIncomeFYSeries, latestNi.end, 5);
      const pastSh = pastNi
        ? ([...sharesFYSeries]
            .filter((x) => x.end === pastNi.end)
            .slice(-1)[0] ?? null)
        : null;

      if (
        pastNi &&
        pastSh &&
        latestSh &&
        pastSh.val !== 0 &&
        latestSh.val !== 0
      ) {
        const latestEps = latestNi.val / latestSh.val;
        const pastEps = pastNi.val / pastSh.val;
        epsCagr5y =
          cagr(pastEps, latestEps, yearsBetween(pastNi.end, latestNi.end)) ??
          undefined;
      }
    }
  }

  // ---- Growth info (CAGR or Turnaround label) ----
  const netIncomeGrowth5y: TurnaroundInfo = latestNiFY?.end
    ? buildGrowthInfo(netIncome.series, latestNiFY.end, 5)
    : { kind: 'na', reason: 'no latest net income end' };

  const epsGrowth5y = (() => {
    // EPS 태그 있으면 EPS로, 없으면 netIncome.series(대체)로 돌리기보단
    // eps.series를 그대로 쓰고, 그것도 없으면 na.
    if (eps.series.length) {
      // end 기준은 “가능하면 latestNiFY.end”
      const end = latestNiFY?.end ?? eps.series.slice(-1)[0]?.end ?? '';
      if (!end) return { kind: 'na', reason: 'no eps end' } as TurnaroundInfo;
      return buildGrowthInfo(eps.series, end, 5);
    }
    return { kind: 'na', reason: 'no eps series' } as TurnaroundInfo;
  })();

  return {
    recentNetIncomeUpdateEnd: recentEnd!,
    ttmRevenue,
    ttmNetIncome,
    netMargin,
    roe,
    revenueCagr5y,
    netIncomeCagr5y,
    epsCagr5y,
    netIncomeGrowth5y,
    epsGrowth5y,
  };
}

// UI 표시용: 0.131 -> "13.10%"
export function formatPct(x?: number): string {
  if (x == null || !Number.isFinite(x)) return 'n/a';
  return `${(x * 100).toFixed(2)}%`;
}

function pickBestSeriesByTTMSupport(
  data: CompanyFactsResponse,
  taxonomy: string,
  concepts: string[],
  unitPref: string[],
): { concept: string | null; series: SecFactItem[] } {
  let best: { concept: string | null; series: SecFactItem[] } = {
    concept: null,
    series: [],
  };

  // 점수: FY 있으면 +100, 분기 4개 이상이면 +50, 총 개수로 가중
  const scoreSeries = (s: SecFactItem[]) => {
    const fyLike = s.filter(
      (x) =>
        x.fp === 'FY' ||
        ['10-K', '10-K/A', '20-F', '40-F'].includes(String(x.form)),
    ).length;

    const qLike = s.filter(
      (x) =>
        ['Q1', 'Q2', 'Q3', 'Q4'].includes(String(x.fp)) ||
        ['10-Q', '10-Q/A'].includes(String(x.form)),
    ).length;

    const hasFY = fyLike > 0;
    const has4Q = qLike >= 4;

    return (hasFY ? 100 : 0) + (has4Q ? 50 : 0) + Math.min(s.length, 20);
  };

  let bestScore = -1;

  for (const c of concepts) {
    const s = pickUnitSeries(data, taxonomy, c, unitPref);
    if (!s.length) continue;

    const sc = scoreSeries(s);
    if (sc > bestScore) {
      bestScore = sc;
      best = { concept: c, series: s };
    }
  }

  return best;
}

// ==============================
// Past checklist (5 items)
// - 산업 비교(outperformIndustry) 제거
// - Simply 느낌: 보수적으로 PASS 조건 설정
// ==============================

export type PastChecklistKey =
  | 'qualityOfEarnings'
  | 'improvingMargins'
  | 'earningsTrend'
  | 'acceleratingGrowth'
  | 'highROE';

export type PastChecklistItem = {
  key: PastChecklistKey;
  label: string;
  pass: boolean;
  detail?: string;
};

export type PastChecklistResult = {
  score: number; // 0~5
  items: PastChecklistItem[];
  recentEnd?: string;

  // optional debug numbers
  netMarginLatest?: number;
  netMarginPast?: number;
  revenueCagr3y?: number;
  revenueCagr5y?: number;
  netIncomeCagr5y?: number;
  roe?: number;
  quality?: {
    ocfFY?: number;
    niFY?: number;
    fcfFY?: number;
  };
};

function pickLatestAsOf(
  items: SecFactItem[],
  asOfEnd: string,
): SecFactItem | null {
  const t = parseDate(asOfEnd);
  const cands = items.filter((x) => parseDate(x.end) <= t);
  return cands.length ? cands[cands.length - 1] : null;
}

/**
 * SimplyWallSt 스타일 "과거 기준 점검" (산업 비교 제외)
 * - 1) 양질의 수익 (OCF > NI 또는 FCF > 0)
 * - 2) 이익 마진 증가 (5y 전 대비 최근 마진 증가)
 * - 3) 수익추이 (최근 FY 순이익 > 0 AND NI 5y CAGR > 0)
 * - 4) 성장 가속화 (Rev 3y CAGR > Rev 5y CAGR)
 * - 5) 높은 ROE (ROE > 15% 기본)
 */
// ✅ 추가 헬퍼: 특정 FY end에 맞는 값을 우선 뽑고, 없으면 최신 FY
function pickFYAsOf(items: SecFactItem[], end: string): SecFactItem | null {
  const fy = items.filter(
    (x) =>
      x.fp === 'FY' &&
      ['10-K', '10-K/A', '20-F', '40-F'].includes(String(x.form)),
  );
  if (!fy.length) return null;

  const exact = fy.filter((x) => x.end === end);
  if (exact.length) return exact[exact.length - 1];

  // end 이전 중 가장 최신 (없으면 전체 최신)
  const asOf = fy.filter((x) => parseDate(x.end) <= parseDate(end));
  return (asOf.length ? asOf[asOf.length - 1] : fy[fy.length - 1]) ?? null;
}

export function computePastChecklistSimplyStyle(
  data: CompanyFactsResponse,
  opts?: { roeThreshold?: number }, // default 0.15
): PastChecklistResult {
  const roeThreshold = opts?.roeThreshold ?? 0.15;

  // ---- concepts ----
  const revenueConcepts = [
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'Revenues',
    'SalesRevenueNet',
    'SalesRevenueGoodsNet',
    'SalesRevenueServicesNet',
    'Revenue', // IFRS fallback hint
  ];

  const netIncomeConcepts = [
    'NetIncomeLoss', // us-gaap
    'ProfitLoss', // ifrs
    'ProfitLossAttributableToOwnersOfParent',
  ];

  const equityConcepts = [
    'StockholdersEquity',
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
    'Equity',
    'EquityAttributableToOwnersOfParent',
  ];

  const ocfConcepts = [
    'NetCashProvidedByUsedInOperatingActivities', // us-gaap
    'CashFlowsFromUsedInOperatingActivities', // ifrs variants
    'NetCashFlowsFromUsedInOperatingActivities',
    'CashFlowsFromUsedInOperations',
  ];

  const capexConcepts = [
    'PaymentsToAcquirePropertyPlantAndEquipment',
    'PaymentsToAcquireProductiveAssets',
    'CapitalExpenditures',
    // ifrs variants
    'PurchaseOfPropertyPlantAndEquipment',
    'AdditionsToPropertyPlantAndEquipment',
    'PaymentsToAcquireIntangibleAssets',
    'PurchaseOfIntangibleAssets',
  ];

  // ---- pick revenue / net income (us-gaap 우선, 없으면 ifrs-full) ----
  const revenue = (() => {
    const us = pickBestSeriesByTTMSupport(data, 'us-gaap', revenueConcepts, [
      'USD',
    ]);
    if (us.series.length) {
      return {
        taxonomy: 'us-gaap' as const,
        concept: us.concept,
        series: us.series,
      };
    }
    const ifrs = pickBestSeriesByTTMSupport(
      data,
      'ifrs-full',
      revenueConcepts,
      ['USD', 'DKK', 'EUR'],
    );
    return {
      taxonomy: 'ifrs-full' as const,
      concept: ifrs.concept,
      series: ifrs.series,
    };
  })();

  const netIncome = pickFirstSeriesCrossTaxonomy(data, netIncomeConcepts, [
    'USD',
    'DKK',
    'EUR',
  ]);

  // ---- FY-like series (10-K FY 있으면 그거, 없으면 annual-like) ----
  const revenueFYSeries = (() => {
    const k = filterByFp(filterByForms(revenue.series, ['10-K', '10-K/A']), [
      'FY',
    ]);
    if (k.length) return k;
    return revenue.series.filter(isAnnualLike);
  })();

  const netIncomeFYSeries = (() => {
    const k = filterByFp(filterByForms(netIncome.series, ['10-K', '10-K/A']), [
      'FY',
    ]);
    if (k.length) return k;
    return netIncome.series.filter(isAnnualLike);
  })();

  const latestRevFY = revenueFYSeries.length
    ? revenueFYSeries[revenueFYSeries.length - 1]
    : null;

  const latestNiFY = netIncomeFYSeries.length
    ? netIncomeFYSeries[netIncomeFYSeries.length - 1]
    : null;

  const recentEnd = latestNiFY?.end ?? latestRevFY?.end;

  // =========================
  // 1) Quality of Earnings (Simply-like)
  // ✅ rule: NI(FY) > 0 AND FCF(FY) > NI(FY)
  // =========================
  const ocf = ((): SecFactItem[] => {
    for (const c of ocfConcepts) {
      const us = pickUnitSeriesWithCurrencyFallback(data, 'us-gaap', c, [
        'USD',
      ]);
      if (us.length) return us;
      const ifrs = pickUnitSeriesWithCurrencyFallback(data, 'ifrs-full', c, [
        'DKK',
        'EUR',
        'USD',
      ]);
      if (ifrs.length) return ifrs;
    }
    return [];
  })();

  const capex = ((): SecFactItem[] => {
    for (const c of capexConcepts) {
      const us = pickUnitSeriesWithCurrencyFallback(data, 'us-gaap', c, [
        'USD',
      ]);
      if (us.length) return us;
      const ifrs = pickUnitSeriesWithCurrencyFallback(data, 'ifrs-full', c, [
        'DKK',
        'EUR',
        'USD',
      ]);
      if (ifrs.length) return ifrs;
    }
    return [];
  })();

  const ocfFYItem =
    latestNiFY?.end && ocf.length
      ? (pickFYAsOf(ocf, latestNiFY.end) ?? pickAnnualAsOf(ocf, latestNiFY.end))
      : null;

  const capexFYItem =
    latestNiFY?.end && capex.length
      ? (pickFYAsOf(capex, latestNiFY.end) ??
        pickAnnualAsOf(capex, latestNiFY.end))
      : null;

  const ocfFY = ocfFYItem?.val;
  const capexFYVal = capexFYItem?.val;

  // CapEx 부호가 회사마다 다를 수 있어서: "지출"이면 보통 음수.
  // FCF는 OCF + CapEx 로 통일 (네 기존 철학 유지)
  const fcfFY =
    ocfFY != null && capexFYVal != null ? ocfFY + capexFYVal : undefined;

  const qualityPass =
    latestNiFY?.val != null &&
    latestNiFY.val > 0 &&
    fcfFY != null &&
    fcfFY > latestNiFY.val;

  // =========================
  // 2) Improving margins (Simply-like)
  // ✅ rule: (latest margin > 0) AND (YoY margin improved)
  // =========================
  let netMarginLatest: number | undefined;
  let netMarginPast: number | undefined; // 여기서는 "YoY" 의미로 바로 전 FY 마진

  const prevRevFY =
    revenueFYSeries.length >= 2
      ? revenueFYSeries[revenueFYSeries.length - 2]
      : null;
  const prevNiFY =
    netIncomeFYSeries.length >= 2
      ? netIncomeFYSeries[netIncomeFYSeries.length - 2]
      : null;

  if (latestRevFY && latestNiFY && latestRevFY.val !== 0) {
    // end가 안맞아도(ADR/IFRS 종종) "latest"끼리 계산은 가능
    netMarginLatest = latestNiFY.val / latestRevFY.val;
  }
  if (prevRevFY && prevNiFY && prevRevFY.val !== 0) {
    netMarginPast = prevNiFY.val / prevRevFY.val;
  }

  const improvingMarginsPass =
    netMarginLatest != null &&
    netMarginPast != null &&
    netMarginLatest > 0 &&
    netMarginLatest > netMarginPast;

  // =========================
  // 3) Earnings trend (그대로)
  // =========================
  let netIncomeCagr5y: number | undefined;

  if (latestNiFY) {
    const pastNi5 = pickPastValueNearYears(
      netIncomeFYSeries,
      latestNiFY.end,
      5,
    );
    if (pastNi5) {
      netIncomeCagr5y =
        cagr(
          pastNi5.val,
          latestNiFY.val,
          yearsBetween(pastNi5.end, latestNiFY.end),
        ) ?? undefined;
    }
  }

  // ✅ helper: 연간(FY 또는 annual-like)만 추려서 end 기준 정렬
  const annualNi = [...netIncomeFYSeries]
    .filter((x) => x.fp === 'FY' || isAnnualLike(x))
    .sort((a, b) => parseDate(a.end) - parseDate(b.end));

  // ✅ 최근 3개 "연간" 기준 흑자 카운트
  const last3Ni = annualNi.slice(-3);
  const positiveCount3y = last3Ni.filter((x) => x.val > 0).length;

  const niLatest = latestNiFY?.val;

  // ✅ Simply에 더 가까운 해석:
  // - CAGR이 계산 가능하면 CAGR>0
  // - CAGR이 n/a면 "최근 3년 중 대부분(>=2) 흑자"면 PASS
  const earningsTrendPass =
    niLatest != null &&
    niLatest > 0 &&
    ((netIncomeCagr5y != null && netIncomeCagr5y > 0) ||
      (netIncomeCagr5y == null && positiveCount3y >= 2));

  // =========================
  // 4) Accelerating growth (Simply-like)
  // ✅ rule: Rev YoY growth > Rev 3Y CAGR
  // =========================
  let revenueCagr3y: number | undefined;
  let revenueYoY: number | undefined;

  if (latestRevFY && prevRevFY && prevRevFY.val !== 0) {
    revenueYoY = latestRevFY.val / prevRevFY.val - 1;
  }

  if (latestRevFY) {
    const past3 = pickPastValueNearYears(revenueFYSeries, latestRevFY.end, 3);
    if (past3) {
      revenueCagr3y =
        cagr(
          past3.val,
          latestRevFY.val,
          yearsBetween(past3.end, latestRevFY.end),
        ) ?? undefined;
    }
  }

  const acceleratingGrowthPass =
    revenueYoY != null && revenueCagr3y != null && revenueYoY > revenueCagr3y;

  // =========================
  // 5) High ROE (그대로, 다만 ifrs equity도 커버)
  // =========================
  let roe: number | undefined;

  const equity = ((): SecFactItem[] => {
    for (const c of equityConcepts) {
      const us = pickUnitSeriesWithCurrencyFallback(data, 'us-gaap', c, [
        'USD',
      ]);
      if (us.length) return us;
      const ifrs = pickUnitSeriesWithCurrencyFallback(data, 'ifrs-full', c, [
        'DKK',
        'EUR',
        'USD',
      ]);
      if (ifrs.length) return ifrs;
    }
    return [];
  })();

  if (equity.length && latestNiFY?.end) {
    const eqLatest = pickLatestAsOf(equity, latestNiFY.end);
    const eqPast = eqLatest
      ? pickPastValueNearYears(equity, eqLatest.end, 1)
      : null;
    if (eqLatest && eqPast) {
      const avgEq = (eqLatest.val + eqPast.val) / 2;
      if (avgEq !== 0) roe = latestNiFY.val / avgEq;
    }
  }

  const highRoePass = roe != null && roe > roeThreshold;

  const items: PastChecklistItem[] = [
    {
      key: 'qualityOfEarnings',
      label: '양질의 수익',
      pass: !!qualityPass,
      detail:
        latestNiFY?.val != null && latestNiFY.val <= 0
          ? `NI(FY) ${latestNiFY.val.toLocaleString()} (적자 → FAIL)`
          : fcfFY != null && latestNiFY?.val != null
            ? `FCF(FY) ${fcfFY.toLocaleString()} vs NI(FY) ${latestNiFY.val.toLocaleString()} (Simply: FCF>NI)`
            : 'FCF/NI 데이터 부족',
    },
    {
      key: 'improvingMargins',
      label: '이익 마진 증가',
      pass: !!improvingMarginsPass,
      detail:
        netMarginLatest != null && netMarginPast != null
          ? `YoY ${(netMarginPast * 100).toFixed(2)}% → ${(netMarginLatest * 100).toFixed(2)}%`
          : 'YoY 마진 비교 데이터 부족',
    },
    {
      key: 'earningsTrend',
      label: '수익추이',
      pass: !!earningsTrendPass,
      detail:
        netIncomeCagr5y != null
          ? `NI 5Y CAGR ${(netIncomeCagr5y * 100).toFixed(2)}%`
          : 'NI 5Y CAGR 계산 불가',
    },
    {
      key: 'acceleratingGrowth',
      label: '성장 가속화',
      pass: !!acceleratingGrowthPass,
      detail:
        revenueYoY != null && revenueCagr3y != null
          ? `Rev YoY ${(revenueYoY * 100).toFixed(2)}% vs 3Y CAGR ${(revenueCagr3y * 100).toFixed(2)}%`
          : 'YoY/3Y 비교 데이터 부족',
    },
    {
      key: 'highROE',
      label: '높은 ROE',
      pass: !!highRoePass,
      detail:
        roe != null
          ? `ROE ${(roe * 100).toFixed(2)}% (기준 ${(roeThreshold * 100).toFixed(0)}%)`
          : 'ROE 계산 불가(Equity 데이터 부족)',
    },
  ];

  const score = items.reduce((s, it) => s + (it.pass ? 1 : 0), 0);

  return {
    score,
    items,
    recentEnd,
    netMarginLatest,
    netMarginPast,
    revenueCagr3y, // 이제 3Y CAGR
    revenueCagr5y: undefined, // 더 이상 안쓰면 undefined로 둠
    netIncomeCagr5y,
    roe,
    quality: { ocfFY, niFY: latestNiFY?.val, fcfFY },
  };
}
