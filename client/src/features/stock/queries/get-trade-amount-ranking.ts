import {
  hasHantuConfig,
  withHantuToken,
} from '@/features/stock/queries/get-hantu-access-token';
import type {
  TradeAmountRankingQuery,
  TradeAmountRankingResponse,
} from '@/features/stock/types';
import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';

const TR_ID = 'HHDFS76320010';
const TRADE_AMOUNT_RANKING_PATH = '/uapi/overseas-stock/v1/ranking/trade-pbmn';

const EMPTY_RANKING: TradeAmountRankingResponse = {
  rt_cd: '0',
  msg_cd: '',
  msg1: '',
  output1: { zdiv: '', stat: '', crec: '', trec: '', nrec: '' },
  output2: [],
};

function getHantuBaseUrl(): string {
  const url =
    process.env.HANTU_BASE_URL ?? 'https://openapi.koreainvestment.com:9443';
  return url.replace(/\/$/, '');
}

function getHantuHeaders(): Record<string, string> {
  const appkey = process.env.HANTU_APP_KEY ?? process.env.HANTU_API_KEY;
  const appsecret =
    process.env.HANTU_APP_SECRET ?? process.env.HANTU_SECRET_KEY;

  if (!appkey || !appsecret) {
    throw new Error(
      'HANTU_APP_KEY(또는 HANTU_API_KEY), HANTU_APP_SECRET(또는 HANTU_SECRET_KEY)가 필요합니다.',
    );
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
  query: Partial<TradeAmountRankingQuery>,
): Record<string, string> {
  return {
    KEYB: query.KEYB ?? '',
    AUTH: query.AUTH ?? '',
    EXCD: query.EXCD ?? 'NAS',
    NDAY: query.NDAY ?? '0',
    VOL_RANG: query.VOL_RANG ?? '0',
    PRC1: query.PRC1 ?? '',
    PRC2: query.PRC2 ?? '',
  };
}

export type GetTradeAmountRankingOptions = Partial<TradeAmountRankingQuery>;

const hantuFetcher = createFetcher({
  baseUrl: getHantuBaseUrl(),
  defaultHeaders: { 'content-type': 'application/json; charset=utf-8' },
});

export const getTradeAmountRanking = cache(
  async (
    options: GetTradeAmountRankingOptions = {},
  ): Promise<TradeAmountRankingResponse> => {
    if (!hasHantuConfig()) {
      return EMPTY_RANKING;
    }

    const data = await withHantuToken((access_token) =>
      hantuFetcher.get<TradeAmountRankingResponse>(TRADE_AMOUNT_RANKING_PATH, {
        params: buildParams(options),
        headers: {
          ...getHantuHeaders(),
          authorization: `Bearer ${access_token}`,
        },
      }),
    );

    if (data.rt_cd !== '0') {
      throw new Error(data.msg1 ?? `API 실패: ${data.msg_cd}`);
    }

    return data;
  },
);
