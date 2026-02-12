import { Heading } from '@/components/heading';
import { Spinner } from '@/components/spinner';
import { StockList } from '@/features/stock/components/stock-list';
import { stockSearchParamsCache } from '@/features/stock/search-params';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

/** 한투 API 등 런타임 env가 필요하므로 매 요청마다 서버에서 렌더 (정적 생성 시 빈 데이터 고정 방지) */
export const dynamic = 'force-dynamic';

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Heading title="주식들" description="" />

      <Suspense fallback={<Spinner />}>
        <StockList
          searchParams={stockSearchParamsCache.parse(await searchParams)}
        />
      </Suspense>
    </div>
  );
};

export default HomePage;
