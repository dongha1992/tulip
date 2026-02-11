'use client';

import { Pagination } from '@/components/pagination/pagination';
import { PaginatedData } from '@/components/pagination/types';
import { useQueryStates } from 'nuqs';
import {
  stockPaginationOptions,
  stockPaginationParser,
} from '../search-params';

type StockPaginationProps = {
  paginatedMetadata: PaginatedData<unknown>['metadata'];
};

const StockPagination = ({ paginatedMetadata }: StockPaginationProps) => {
  const [pagination, setPagination] = useQueryStates(
    stockPaginationParser,
    stockPaginationOptions,
  );

  return (
    <Pagination
      pagination={pagination}
      onPagination={setPagination}
      paginatedMetadata={paginatedMetadata}
    />
  );
};

export { StockPagination };
