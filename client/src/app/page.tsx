import { Heading } from '@/components/heading';
import { Spinner } from '@/components/spinner';
import { StockList } from '@/features/stock/components/stock-list';
import { getYahooQuoteSummary } from '@/features/stock/queries/get-yahoo-stock-forecast';
import { stockSearchParamsCache } from '@/features/stock/search-params';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

type HomePageProps = {
  searchParams: Promise<SearchParams>;
};

const HomePage = async ({ searchParams }: HomePageProps) => {
  // 기본 모듈 (financialData, earningsTrend)
  const summary = await getYahooQuoteSummary('AAPL');

  // 특정 모듈만 요청

  // 사용 예
  const price = summary.price?.regularMarketPrice;
  const currency = summary.price?.currency;
  const financialData = summary.financialData; // targetMeanPrice, recommendationKey 등
  const earningsTrend = summary.earningsTrend; //
  const insights = summary.insights;

  // console.log(price, currency, financialData, earningsTrend, insights);
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
