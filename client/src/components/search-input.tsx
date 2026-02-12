'use client';

import { debounce } from '@/lib/utils';
import { Input } from './ui/input';

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

const SearchInput = ({
  value,
  onChange,
  placeholder = '',
  className,
}: SearchInputProps) => {
  const handleSearch = debounce(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    250,
  );

  return (
    <Input
      defaultValue={value}
      onChange={handleSearch}
      placeholder={placeholder}
      className={className}
    />
  );
};

export { SearchInput };
