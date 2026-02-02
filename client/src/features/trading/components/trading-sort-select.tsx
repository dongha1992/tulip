'use client';

import { SortSelect, SortSelectOption } from '@/components/sort-select';
import { useQueryStates } from 'nuqs';
import { sortOptions, sortParser } from '../search-params';

type TradingSortSelectProps = {
  options: SortSelectOption[];
};

// TODO: 여기가 위치 아닌 거 같음
export const SORT_OPTIONS = [
  {
    sortKey: 'createdAt',
    sortValue: 'desc',
    label: '최신순',
  },
  {
    sortKey: 'createdAt',
    sortValue: 'asc',
    label: '오래된순',
  },
  {
    sortKey: 'buy',
    sortValue: 'desc',
    label: '구매가격 높은순',
  },
];

const TradingSortSelect = ({ options }: TradingSortSelectProps) => {
  const [sort, setSort] = useQueryStates(sortParser, sortOptions);

  return <SortSelect value={sort} onChange={setSort} options={options} />;
};

export { TradingSortSelect };
