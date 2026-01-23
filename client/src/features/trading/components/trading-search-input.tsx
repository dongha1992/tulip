"use client";

import { SearchInput } from "@/components/search-input";
import { useQueryState } from "nuqs";
import { searchParser } from "../search-params";

type SearchInputProps = {
  placeholder: string;
};

const TradingSearchInput = ({ placeholder }: SearchInputProps) => {
  const [search, setSearch] = useQueryState("search", searchParser);

  return (
    <SearchInput
      value={search}
      onChange={setSearch}
      placeholder={placeholder}
    />
  );
};

export { TradingSearchInput };
