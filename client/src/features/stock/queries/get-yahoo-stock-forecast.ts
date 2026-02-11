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
  'financialData',
  'earningsTrend',
  'recommendationTrend',
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
