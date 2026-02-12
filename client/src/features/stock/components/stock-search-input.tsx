'use client';
import { SearchInput } from '@/components/search-input';
import { useQueryState } from 'nuqs';
import { searchParser } from '../search-params';

type StockSearchInputProps = {
  placeholder: string;
  className?: string;
};

const StockSearchInput = ({
  placeholder,
  className,
}: StockSearchInputProps) => {
  const [search, setSearch] = useQueryState('search', searchParser);

  return (
    <SearchInput
      value={search}
      onChange={setSearch}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default StockSearchInput;
