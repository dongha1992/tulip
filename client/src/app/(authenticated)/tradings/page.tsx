import { CardCompact } from '@/components/card-compact';
import { Heading } from '@/components/heading';
import { Spinner } from '@/components/spinner';
import { getAuth } from '@/features/auth/queries/get-auth';
import { TradingList } from '@/features/trading/components/trading-list';
import { TradingUpsertForm } from '@/features/trading/components/trading-upsert-form';
import { searchParamsCache } from '@/features/trading/search-params';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

type TradingsPageProps = {
  searchParams: Promise<SearchParams>;
};

const TradingsPage = async ({ searchParams }: TradingsPageProps) => {
  const { user } = await getAuth();
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Heading title="나의 거래 내역" description="거래내역임다." />
      <CardCompact
        title="매매 기록하기"
        description="매매를 기록해보자"
        className="w-full max-w-[420px] self-center"
        content={<TradingUpsertForm />}
      />

      <Suspense fallback={<Spinner />}>
        <TradingList
          userId={user?.id}
          searchParams={searchParamsCache.parse(await searchParams)}
        />
      </Suspense>
    </div>
  );
};

export default TradingsPage;
