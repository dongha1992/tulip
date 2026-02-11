import { cache } from 'react';

export type ShortInterestResponse = {
  status: 'success';
  symbol: string;
  updated: string | null;
  fee2: string | null;
  available: string | null;
  rebate3: string | null;
};

export type ShortInterestData = Omit<
  ShortInterestResponse,
  'status' | 'symbol'
>;

function mapExcdToExchangeSlug(excd: string): string {
  const upper = excd.toUpperCase();
  switch (upper) {
    case 'NAS':
      return 'nasdaq';
    case 'NYS':
      return 'nyse';
    case 'AMS':
      return 'nyseamerican';
    default:
      return upper.toLowerCase();
  }
}

export const getShortInterest = cache(
  async (excd: string, symb: string): Promise<ShortInterestData> => {
    const exchange = mapExcdToExchangeSlug(excd);
    const symbol = `${exchange}-${symb.toLowerCase()}`;

    const res = await fetch(`http://localhost:3000/api/short-interest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`short-interest API 실패: ${text}`);
    }

    const data: ShortInterestResponse = await res.json();

    return {
      updated: data.updated,
      fee2: data.fee2,
      available: data.available,
      rebate3: data.rebate3,
    };
  },
);
