import { Heading } from '@/components/heading';
import { Spinner } from '@/components/spinner';
import { StockList } from '@/features/stock/components/stock-list';
import { stockSearchParamsCache } from '@/features/stock/search-params';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

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
