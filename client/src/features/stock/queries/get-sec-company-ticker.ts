import type { SecCompanyTickerMap } from '@/features/stock/types';
import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';

const SEC_COMPANY_TICKER_URL = process.env.SEC_COMPANY_TICKER;

const secTickerFetcher = createFetcher({
  baseUrl: '',
});

/**
 * SEC company_tickers.json 조회
 * - ENV: SEC_COMPANY_TICKER (예: https://www.sec.gov/files/company_tickers.json)
 */
export const getSecCompanyTicker = cache(
  async (): Promise<SecCompanyTickerMap> => {
    if (!SEC_COMPANY_TICKER_URL) {
      throw new Error('SEC_COMPANY_TICKER 환경 변수가 설정되지 않았습니다.');
    }

    const data = await secTickerFetcher.get<SecCompanyTickerMap>(
      SEC_COMPANY_TICKER_URL,
      {
        headers: {
          'User-Agent': 'tulip-app/1.0 (contact: dev@tulip.local)',
          Accept: 'application/json',
        },
        next: { revalidate: 60 * 60 * 24 },
      },
    );

    return data;
  },
);
