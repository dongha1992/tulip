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

export const getHantuAccessToken = cache(
  async (): Promise<HantuTokenResponse> => {
    const body = getTokenBody();
    const data = await hantuTokenFetcher.post<HantuTokenResponse>(
      TOKEN_PATH,
      body,
      {
        next: { revalidate: false },
      },
    );

    if (!data.access_token) {
      throw new Error('접근토큰 발급 실패: access_token 없음');
    }

    return data;
  },
);
