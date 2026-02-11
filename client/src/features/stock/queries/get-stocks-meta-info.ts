import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';
import { ParsedStockSearchParams } from '../search-params';
import type { StocksMetaInfoResponse } from '../types';

export const getStocksMetaInfo = cache(
  async (searchParams?: ParsedStockSearchParams) => {
    const stockMetaInfoFetcher = createFetcher({
      baseUrl: process.env.STOCK_API_URL ?? '',
    });

    const data =
      await stockMetaInfoFetcher.get<StocksMetaInfoResponse[]>('stock.json');

    // 상세 페이지 등에서는 검색 파람 없이 전체 메타 정보를 사용
    if (!searchParams || !searchParams.search?.trim()) {
      return Array.isArray(data) ? data : [];
    }

    const keyword = searchParams.search.toLowerCase();

    const searchedData = data.filter((item) =>
      item.name.toLowerCase().includes(keyword),
    );

    return Array.isArray(searchedData) ? searchedData : [];
  },
);
