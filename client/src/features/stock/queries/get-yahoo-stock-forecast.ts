import { cache } from 'react';
import YahooFinance from 'yahoo-finance2';
import type {
  QuoteSummaryModules,
  QuoteSummaryResult,
} from 'yahoo-finance2/modules/quoteSummary';

const yahooFinance = new YahooFinance();

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

const DEFAULT_MODULES = [
  'price',
  'summaryDetail',
  'financialData',
  'earningsTrend',
  'recommendationTrend',
  'majorHoldersBreakdown',
  'defaultKeyStatistics',
  'balanceSheetHistoryQuarterly',
  'incomeStatementHistory',
  'incomeStatementHistoryQuarterly',
] as const satisfies readonly string[];

export const getYahooQuoteSummary = cache(
  async (
    symbol: string,
    modules: readonly string[] = DEFAULT_MODULES,
  ): Promise<QuoteSummaryResult> => {
    const s = normalizeSymbol(symbol);
    const moduleList: QuoteSummaryModules[] =
      modules.length > 0
        ? ([...modules] as QuoteSummaryModules[])
        : [...DEFAULT_MODULES];

    const result = await yahooFinance.quoteSummary(s, {
      modules: moduleList,
    });

    return result;
  },
);

/**
 * Yahoo quote: 현재가/통화 등 단일 종목 시세.
 * @example
 * const quote = await getYahooQuote('AAPL');
 * const { regularMarketPrice: price, currency } = quote;
 */
export const getYahooQuote = cache(async (symbol: string) => {
  const s = normalizeSymbol(symbol);
  return yahooFinance.quote(s);
});

// 매우 단순화한 options 타입 (필요한 필드만)
export type YahooOptionLeg = {
  strike: number;
  openInterest?: number | null;
  volume?: number | null;
};

export type YahooOptionsChain = {
  underlyingSymbol?: string;
  expirationDates?: Array<Date | string>;
  options?: Array<{
    expirationDate?: Date | string;
    calls?: YahooOptionLeg[];
    puts?: YahooOptionLeg[];
  }>;
};

/**
 * Yahoo options: 옵션 체인 스냅샷 (최근 만기 중심).
 */
export const getYahooOptions = cache(
  async (symbol: string): Promise<YahooOptionsChain> => {
    const s = normalizeSymbol(symbol);
    // yahoo-finance2 의 options 구조를 그대로 따르되, 최소 타입만 사용
    const chain = (await yahooFinance.options(s)) as YahooOptionsChain;
    return chain;
  },
);
