import { createFetcher } from '@/lib/fetcher';
import { prisma } from '@/lib/prisma';
import { cache } from 'react';

const HANTU_TOKEN_ID = 'hantu';

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/** API가 토큰 만료로 거부할 때 내려주는 코드 */
export const HANTU_TOKEN_EXPIRED_CODE = 'EGW00123';

/** 토큰 발급 1분당 1회 제한 */
export const HANTU_TOKEN_RATE_LIMIT_CODE = 'EGW00133';

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
  const appkey = process.env.HANTU_APP_KEY;
  const appsecret = process.env.HANTU_SECRET_KEY;

  if (!appkey || !appsecret) {
    throw new Error('HANTU_APP_KEY, HANTU_APP_SECRET가 필요합니다.');
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

let memoryCache: { token: HantuTokenResponse; expiresAt: number } | null = null;

/** 토큰 캐시 비우기  */
export async function clearHantuTokenCache(): Promise<void> {
  memoryCache = null;
  try {
    await prisma.hantuToken.delete({ where: { id: HANTU_TOKEN_ID } });
  } catch {
    console.error('토큰 캐시 비우기 실패');
  }
}

function wrapTokenFetchError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes(HANTU_TOKEN_RATE_LIMIT_CODE)) {
    console.error(err);
  }
  throw err;
}

/** DB에 유효한 토큰이 있으면 반환 */
async function getTokenFromDb(now: number): Promise<HantuTokenResponse | null> {
  try {
    const dbToken = await prisma.hantuToken.findUnique({
      where: { id: HANTU_TOKEN_ID },
    });
    if (!dbToken || dbToken.expiresAt.getTime() <= now + REFRESH_BUFFER_MS) {
      return null;
    }
    return {
      access_token: dbToken.accessToken,
      token_type: 'Bearer',
      expires_in: Math.round((dbToken.expiresAt.getTime() - now) / 1000),
      access_token_token_expired: dbToken.expiresAt.toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchAndSaveToken(): Promise<HantuTokenResponse> {
  const now = Date.now();
  const body = getTokenBody();
  const data = await hantuTokenFetcher.post<HantuTokenResponse>(
    TOKEN_PATH,
    body,
    { next: { revalidate: false } },
  );

  if (!data.access_token) {
    throw new Error('접근토큰 발급 실패: access_token 없음');
  }

  const expiresAt = new Date(now + data.expires_in * 1000);
  memoryCache = { token: data, expiresAt: expiresAt.getTime() };
  try {
    await prisma.hantuToken.upsert({
      where: { id: HANTU_TOKEN_ID },
      create: {
        id: HANTU_TOKEN_ID,
        accessToken: data.access_token,
        expiresAt,
      },
      update: {
        accessToken: data.access_token,
        expiresAt,
      },
    });
  } catch {
    console.error('토큰 저장 실패');
  }
  return data;
}

export const getHantuAccessToken = cache(
  async (forceNew = false): Promise<HantuTokenResponse> => {
    const now = Date.now();

    if (forceNew) {
      memoryCache = null;
      try {
        await prisma.hantuToken.delete({ where: { id: HANTU_TOKEN_ID } });
      } catch {}
    }

    // 1) 메모리 캐시
    if (memoryCache && now < memoryCache.expiresAt - REFRESH_BUFFER_MS) {
      return memoryCache.token;
    }
    if (memoryCache && now >= memoryCache.expiresAt) {
      memoryCache = null;
    }

    // 2) DB에서 조회
    const fromDb = await getTokenFromDb(now);
    if (fromDb) {
      memoryCache = {
        token: fromDb,
        expiresAt: now + fromDb.expires_in * 1000,
      };
      return fromDb;
    }

    // 3) 최초 또는 만료 임박
    try {
      return await fetchAndSaveToken();
    } catch (e) {
      wrapTokenFetchError(e);
    }
  },
);

/**
 * 토큰으로 API 호출 실행.
 * EGW00123(토큰 만료) 시 캐시만 비우고 throw (다음 요청에서 1회만 재발급).
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
      await clearHantuTokenCache();
      console.error(err);
    }
    throw err;
  }
}
