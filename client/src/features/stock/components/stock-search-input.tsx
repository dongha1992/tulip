'use client';
import { SearchInput } from '@/components/search-input';
import { useQueryState } from 'nuqs';
import { searchParser } from '../search-params';

type StockSearchInputProps = {
  placeholder: string;
};

const StockSearchInput = ({ placeholder }: StockSearchInputProps) => {
  const [search, setSearch] = useQueryState('search', searchParser);

  return (
    <SearchInput
      value={search}
      onChange={setSearch}
      placeholder={placeholder}
    />
  );
};

export default StockSearchInput;
