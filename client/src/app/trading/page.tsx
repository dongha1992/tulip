import { Heading } from "@/components/heading";
import { Spinner } from "@/components/spinner";
import { TradingList } from "@/features/trading/components/trading-list";
import { searchParamsCache } from "@/features/trading/search-params";
import { SearchParams } from "nuqs/server";
import { Suspense } from "react";

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Heading
        title="모든 매매 내역"
        description="매매를 복기해보자"
      />

      <Suspense fallback={<Spinner />}> 
        <TradingList
          searchParams={searchParamsCache.parse(await searchParams)}
        />
      </Suspense>
    </div>
  );
};

export default HomePage;
