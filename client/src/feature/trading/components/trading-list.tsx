
import { Placeholder } from "@/components/placeholder";
import { SORT_OPTIONS } from "../constants";
import { getTradings } from "../queries/get-tradings";
import { ParsedSearchParams } from "../search-params";
import { TradingItem } from "./trading-item";
import { TradingPagination } from "./trading-pagination";
import { TradingSearchInput } from "./trading-search-input";
import { TradingSortSelect } from "./trading-sort-select";

type TradingListProps = {
  userId?: string;
  searchParams: ParsedSearchParams;
};

const TradingList = async ({
    userId,
    searchParams,
}: TradingListProps) => {
    const { list: tradings, metadata: tradingMetadata } = await getTradings(
        userId,
        searchParams
    );
    
    return (
        <div className="flex-1 flex flex-col items-center gap-y-4 animate-fade-from-top">
            
 <div className="w-full max-w-[420px] flex gap-x-2">
        <TradingSearchInput placeholder="검색어를 입력하세요" />
        <TradingSortSelect options={SORT_OPTIONS}/>
      </div>
                {tradings.length ? (
                    tradings.map((trading) => <TradingItem key={trading.id} trading={trading} />)
                ) : (
                    <Placeholder label="매매 내력이 없습니다." />
                )}


            <div className="w-full max-w-[420px]">
                <TradingPagination paginatedTradingMetadata={tradingMetadata} />
            </div>

         </div>
    )
}

export { TradingList };
