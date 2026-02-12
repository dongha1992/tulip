import { withHantuToken } from '@/features/stock/queries/get-hantu-access-token';
import type {
  OverseasStockBasicInfoQuery,
  OverseasStockBasicInfoResponse,
} from '@/features/stock/types';
import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';

const TR_ID = 'CTPF1702R';
const OVERSEAS_STOCK_BASIC_INFO_PATH =
  '/uapi/overseas-price/v1/quotations/search-info';

function getHantuBaseUrl(): string {
  const url =
    process.env.HANTU_BASE_URL ?? 'https://openapi.koreainvestment.com:9443';
  return url.replace(/\/$/, '');
}

function getHantuHeaders(): Record<string, string> {
  const appkey = process.env.HANTU_APP_KEY;
  const appsecret = process.env.HANTU_SECRET_KEY;

  if (!appkey || !appsecret) {
    throw new Error('HANTU_APP_KEY, HANTU_APP_SECRET가 필요합니다.');
  }

  return {
    'content-type': 'application/json; charset=utf-8',
    appkey,
    appsecret,
    tr_id: TR_ID,
    custtype: 'P',
  };
}

function buildParams(
  query: OverseasStockBasicInfoQuery,
): Record<string, string> {
  return {
    PRDT_TYPE_CD: query.PRDT_TYPE_CD,
    PDNO: query.PDNO,
  };
}

export type GetStockInfoOptions = OverseasStockBasicInfoQuery;

const hantuFetcher = createFetcher({
  baseUrl: getHantuBaseUrl(),
  defaultHeaders: { 'content-type': 'application/json; charset=utf-8' },
});

export const getStockInfo = cache(
  async (
    options: GetStockInfoOptions,
  ): Promise<OverseasStockBasicInfoResponse | null> => {
    const data = await withHantuToken((access_token) =>
      hantuFetcher.get<OverseasStockBasicInfoResponse>(
        OVERSEAS_STOCK_BASIC_INFO_PATH,
        {
          params: buildParams(options),
          headers: {
            ...getHantuHeaders(),
            authorization: `Bearer ${access_token}`,
          },
        },
      ),
    );

    if (data.rt_cd !== '0') {
      throw new Error(data.msg1 ?? `API 실패: ${data.msg_cd}`);
    }

    return data;
  },
);
