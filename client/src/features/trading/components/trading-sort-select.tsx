"use client";

import { SortSelect, SortSelectOption } from "@/components/sort-select";
import { useQueryStates } from "nuqs";
import { sortOptions, sortParser } from "../search-params";


type TradingSortSelectProps = {
  options: SortSelectOption[];
};


// TODO: 여기가 위치 아닌 거 같음
export const SORT_OPTIONS = [
      {
        sortKey: "createdAt",
        sortValue: "desc",
        label: "Newest",
      },
      {
        sortKey: "createdAt",
        sortValue: "asc",
        label: "Oldest",
      },
      {
        sortKey: "buy",
        sortValue: "desc",
        label: "Buy",
      },
];


const TradingSortSelect = ({ options }: TradingSortSelectProps) => {
  const [sort, setSort] = useQueryStates(sortParser, sortOptions);

  return <SortSelect value={sort} onChange={setSort} options={options} />;
};

export { TradingSortSelect };
