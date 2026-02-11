import { createSearchParamsCache, parseAsInteger } from 'nuqs/server';

import { parseAsString } from 'nuqs/server';

export const searchParser = parseAsString.withDefault('').withOptions({
  shallow: false,
  clearOnDefault: true,
});

export const stockPaginationParser = {
  page: parseAsInteger.withDefault(0),
  size: parseAsInteger.withDefault(10),
};

export const stockPaginationOptions = {
  shallow: false,
  clearOnDefault: true,
};

export const stockSearchParamsCache = createSearchParamsCache({
  search: searchParser,
  ...stockPaginationParser,
});

export type ParsedStockSearchParams = Awaited<
  ReturnType<typeof stockSearchParamsCache.parse>
>;
