type NextFetchConfig = {
  revalidate?: number | false;
  tags?: string[];
};

type FetcherGetOptions = {
  params?: Record<string, string>;
  headers?: Record<string, string>;
  next?: NextFetchConfig;
};

type FetcherPostOptions = {
  headers?: Record<string, string>;
  next?: NextFetchConfig;
};

type FetcherRequestInit = RequestInit & {
  next?: NextFetchConfig;
};

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
): string {
  const url = path.startsWith('http')
    ? path
    : `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params || Object.keys(params).length === 0) return url;
  const search = new URLSearchParams(params).toString();
  return `${url}${url.includes('?') ? '&' : '?'}${search}`;
}

function mergeHeaders(
  ...sources: (Record<string, string> | undefined)[]
): Record<string, string> {
  const acc: Record<string, string> = {};
  for (const src of sources) {
    if (!src) continue;
    for (const [k, v] of Object.entries(src)) {
      if (v !== undefined && v !== '') acc[k] = v;
    }
  }
  return acc;
}

async function handleResponse<T>(
  res: Response,
  parseJson: boolean,
): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API 오류 (${res.status}): ${text}`);
  }
  if (parseJson) return res.json() as Promise<T>;
  return res.text() as Promise<T>;
}

export type CreateFetcherOptions = {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
};

export function createFetcher(options: CreateFetcherOptions) {
  const { baseUrl, defaultHeaders = {} } = options;

  return {
    async get<T = unknown>(
      path: string,
      opts: FetcherGetOptions = {},
    ): Promise<T> {
      const { params, headers = {}, next } = opts;
      const url = buildUrl(baseUrl, path, params);
      const init: FetcherRequestInit = {
        method: 'GET',
        headers: mergeHeaders(defaultHeaders, headers),
        cache: 'no-store',
      };
      if (next) init.next = next;

      const res = await fetch(url, init);
      return handleResponse<T>(res, true);
    },

    async post<T = unknown>(
      path: string,
      body?: unknown,
      opts: FetcherPostOptions = {},
    ): Promise<T> {
      const { headers = {}, next } = opts;
      const url = buildUrl(baseUrl, path);
      const init: FetcherRequestInit = {
        method: 'POST',
        headers: mergeHeaders(defaultHeaders, {
          'content-type': 'application/json; charset=utf-8',
          ...headers,
        }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      };
      if (next) init.next = next;

      const res = await fetch(url, init);
      return handleResponse<T>(res, true);
    },

    async request<T = unknown>(
      path: string,
      init: FetcherRequestInit & { method?: string },
    ): Promise<T> {
      const url = buildUrl(baseUrl, path);
      const headers = mergeHeaders(
        defaultHeaders,
        (init.headers as Record<string, string>) ?? {},
      );
      const res = await fetch(url, { ...init, headers });
      return handleResponse<T>(res, true);
    },
  };
}

export type Fetcher = ReturnType<typeof createFetcher>;
