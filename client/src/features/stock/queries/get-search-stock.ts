import { withHantuToken } from '@/features/stock/queries/get-hantu-access-token';
import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';

const TR_ID = 'HHDFS76200200';
const OVERSEAS_PRICE_DETAIL_PATH =
  '/uapi/overseas-price/v1/quotations/price-detail';

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

export type OverseasPriceDetailQuery = {
  /** 사용자권한정보 (필수지만 테스트에선 공백 사용 가능) */
  AUTH: string;
  /** 거래소명 (NYS, NAS, AMS 등) */
  EXCD: string;
  /** 종목코드 (AAPL, TSLA 등) */
  SYMB: string;
};

export type OverseasPriceDetailOutput = {
  rsym: string;
  pvol: string;
  open: string;
  high: string;
  low: string;
  last: string;
  base: string;
  tomv: string;
  pamt: string;
  uplp: string;
  dnlp: string;
  h52p: string;
  h52d: string;
  l52p: string;
  l52d: string;
  perx: string;
  pbrx: string;
  epsx: string;
  bpsx: string;
  shar: string;
  mcap: string;
  curr: string;
  zdiv: string;
  vnit: string;
  t_xprc: string;
  t_xdif: string;
  t_xrat: string;
  p_xprc: string;
  p_xdif: string;
  p_xrat: string;
  t_rate: string;
  p_rate: string;
  t_xsgn: string;
  p_xsng: string;
  e_ordyn: string;
  e_hogau: string;
  e_icod: string;
  e_parp: string;
  tvol: string;
  tamt: string;
  etyp_nm: string;
};

export type OverseasPriceDetailResponse = {
  rt_cd: string;
  msg_cd: string;
  msg1: string;
  output: OverseasPriceDetailOutput;
};

function buildParams(query: OverseasPriceDetailQuery): Record<string, string> {
  return {
    AUTH: query.AUTH,
    EXCD: query.EXCD,
    SYMB: query.SYMB,
  };
}

export type GetSearchStockOptions = OverseasPriceDetailQuery;

const hantuFetcher = createFetcher({
  baseUrl: getHantuBaseUrl(),
  defaultHeaders: getHantuHeaders(),
});

export const getSearchStock = cache(
  async (
    options: GetSearchStockOptions,
  ): Promise<OverseasPriceDetailResponse> => {
    const data = await withHantuToken((access_token) =>
      hantuFetcher.get<OverseasPriceDetailResponse>(
        OVERSEAS_PRICE_DETAIL_PATH,
        {
          params: buildParams(options),
          headers: { authorization: `Bearer ${access_token}` },
        },
      ),
    );

    if (data.rt_cd !== '0') {
      throw new Error(data.msg1 ?? `API 실패: ${data.msg_cd}`);
    }

    return data;
  },
);
/**
 * 가격 상세 응답에서 등락률(%)과 음/양 구분을 계산한다.
 * - 우선 원환산 당일 등락(t_xrat)을 그대로 사용
 * - 숫자로 해석 불가한 경우 last/base로 직접 계산
 */
export function getPriceChangeInfo(output: OverseasPriceDetailOutput): {
  rateText: string;
  isNegative: boolean;
} | null {
  // 1) t_xrat 우선 사용 (가장 정확하고 실시간 반영되는 값)
  const tryParse = (value: string | undefined): number | null => {
    if (!value) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  let rateNum = tryParse(output.t_xrat);

  // 2) t_xrat이 없거나 숫자가 아니면 last/base로 직접 계산
  if (rateNum === null) {
    const last = Number(output.last);
    const base = Number(output.base);

    if (Number.isFinite(last) && Number.isFinite(base) && base !== 0) {
      rateNum = ((last - base) / base) * 100;
    }
  }

  if (rateNum === null) return null;

  const isNegative = rateNum < 0;
  const rateText = rateNum.toFixed(2); // 소수 둘째 자리까지

  return { rateText, isNegative };
}
