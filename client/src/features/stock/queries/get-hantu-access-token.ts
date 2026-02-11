import { createFetcher } from '@/lib/fetcher';
import { cache } from 'react';

export type HantuTokenRequest = {
  grant_type: 'client_credentials';
  appkey: string;
  appsecret: string;
};

export type HantuTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  access_token_token_expired: string;
};

const TOKEN_PATH = '/oauth2/tokenP';

function getHantuBaseUrl(): string {
  const url =
    process.env.HANTU_BASE_URL ?? 'https://openapi.koreainvestment.com:9443';
  return url.replace(/\/$/, '');
}

function getTokenBody(): HantuTokenRequest {
  const appkey = process.env.HANTU_APP_KEY ?? process.env.HANTU_API_KEY;
  const appsecret =
    process.env.HANTU_APP_SECRET ?? process.env.HANTU_SECRET_KEY;

  if (!appkey || !appsecret) {
    throw new Error(
      'HANTU_APP_KEY(또는 HANTU_API_KEY), HANTU_APP_SECRET(또는 HANTU_SECRET_KEY)가 필요합니다.',
    );
  }

  return {
    grant_type: 'client_credentials',
    appkey,
    appsecret,
  };
}

const hantuTokenFetcher = createFetcher({
  baseUrl: getHantuBaseUrl(),
  defaultHeaders: {
    'content-type': 'application/json; charset=UTF-8',
  },
});

/** 만료 5분 전이면 재발급 (서버가 조기 만료할 수 있어 여유 둠) */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** API가 토큰 만료로 거부할 때 내려주는 코드 */
export const HANTU_TOKEN_EXPIRED_CODE = 'EGW00123';

/** 토큰 발급 1분당 1회 제한 */
export const HANTU_TOKEN_RATE_LIMIT_CODE = 'EGW00133';

let cached: { token: HantuTokenResponse; expiresAt: number } | null = null;

/** 토큰 캐시 비우기 (만료 오류 시 재발급 유도용) */
export function clearHantuTokenCache(): void {
  cached = null;
}

function wrapTokenFetchError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes(HANTU_TOKEN_RATE_LIMIT_CODE)) {
    console.error(err);
  }
  throw err;
}

async function fetchHantuToken(): Promise<HantuTokenResponse> {
  const now = Date.now();
  const body = getTokenBody();
  try {
    const data = await hantuTokenFetcher.post<HantuTokenResponse>(
      TOKEN_PATH,
      body,
      { next: { revalidate: false } },
    );
    if (!data.access_token) {
      throw new Error('접근토큰 발급 실패: access_token 없음');
    }
    cached = {
      token: data,
      expiresAt: now + data.expires_in * 1000,
    };
    return data;
  } catch (e) {
    wrapTokenFetchError(e);
  }
}

export const getHantuAccessToken = cache(
  async (forceNew = false): Promise<HantuTokenResponse> => {
    if (forceNew) {
      cached = null;
    }

    const now = Date.now();

    if (cached && now < cached.expiresAt - REFRESH_BUFFER_MS) {
      return cached.token;
    }

    if (cached && now >= cached.expiresAt) {
      cached = null;
    }

    return fetchHantuToken();
  },
);

/**
 * 토큰으로 API 호출 실행.
 * EGW00123(토큰 만료) 시 즉시 토큰 재발급하지 않고 캐시만 비운 뒤 안내 throw.
 * (1분당 1회 제한 회피, 다음 새로고침 시 새 토큰 1회만 발급)
 */
export async function withHantuToken<T>(
  fn: (accessToken: string) => Promise<T>,
): Promise<T> {
  try {
    const { access_token } = await getHantuAccessToken();
    return await fn(access_token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes(HANTU_TOKEN_EXPIRED_CODE)) {
      clearHantuTokenCache();
      console.error(err);
    }
    throw err;
  }
}
