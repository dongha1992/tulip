'use client';

import { Pagination } from '@/components/pagination/pagination';
import { PaginatedData } from '@/components/pagination/types';
import { useQueryState, useQueryStates } from 'nuqs';
import { useEffect, useRef } from 'react';
import {
  paginationOptions,
  paginationParser,
  searchParser,
} from '../search-params';
import { TradingWithMetadata } from '../types';

type TradingPaginationProps = {
  paginatedTradingMetadata: PaginatedData<TradingWithMetadata>['metadata'];
};

const TradingPagination = ({
  paginatedTradingMetadata,
}: TradingPaginationProps) => {
  const [pagination, setPagination] = useQueryStates(
    paginationParser,
    paginationOptions,
  );
  const [search] = useQueryState('search', searchParser);

  const prevSearch = useRef(search);

  useEffect(() => {
    if (search === prevSearch.current) return;
    prevSearch.current = search;

    setPagination({ ...pagination, page: 0 });
  }, [search, pagination, setPagination]);

  return (
    <Pagination
      pagination={pagination}
      onPagination={setPagination}
      paginatedMetadata={paginatedTradingMetadata}
    />
  );
};

export { TradingPagination };
