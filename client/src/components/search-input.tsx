"use client";

import { Input } from "./ui/input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

// TODO: 디바운스 구현
const SearchInput = ({ value, onChange, placeholder }: SearchInputProps) => {
  const handleSearch = 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    }

  return (
    <Input
      defaultValue={value}
      onChange={handleSearch}
      placeholder={placeholder}
    />
  );
};

export { SearchInput };
