import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';
import type { CompanyFactsResponse } from '../types';

function getSecBaseUrl(): string {
  const raw = process.env.SEC_API_URL ?? 'https://data.sec.gov/api';
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, '');
}

const secFetcher = createFetcher({
  baseUrl: getSecBaseUrl(),
  defaultHeaders: {
    'User-Agent': 'tulip-app/1.0 (contact: dev@tulip.local)',
    Accept: 'application/json',
  },
});

function normalizeCik(cik: string | number): string {
  const digits = String(cik).replace(/[^0-9]/g, '');
  return digits.padStart(10, '0');
}

export const getCompanyFacts = cache(
  async (cik: string | number): Promise<CompanyFactsResponse> => {
    const normalized = normalizeCik(cik);
    const path = `/xbrl/companyfacts/CIK${normalized}.json`;

    const data = await secFetcher.get<CompanyFactsResponse>(path, {
      next: { revalidate: 60 * 60 },
    });

    return data;
  },
);
