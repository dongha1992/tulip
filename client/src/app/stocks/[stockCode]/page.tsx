import { StockDetailCard } from '@/features/stock/components/stock-detail-card';
import { getStockInfo } from '@/features/stock/queries/get-stock-info';
import { getStocksMetaInfo } from '@/features/stock/queries/get-stocks-meta-info';
import type { OverseasStockBasicInfoResponse } from '@/features/stock/types';
import { notFound } from 'next/navigation';

type StockDetailPageProps = {
  params: Promise<{
    stockCode: string;
  }>;
  searchParams: Promise<{
    PRDT_TYPE_CD?: string;
    PDNO?: string;
  }>;
};

const StockDetailPage = async ({
  params,
  searchParams,
}: StockDetailPageProps) => {
  const { stockCode } = await params;
  const resolvedSearchParams = await searchParams;
  const productTypeCode = resolvedSearchParams.PRDT_TYPE_CD;
  const pdno = resolvedSearchParams.PDNO ?? stockCode;

  if (!productTypeCode) {
    notFound();
  }

  const [stocksMetaInfo, stockInfo] = await Promise.all([
    getStocksMetaInfo(),
    getStockInfo({
      PRDT_TYPE_CD: productTypeCode,
      PDNO: pdno,
    }),
  ]);

  const meta = stocksMetaInfo.find((m) => m.stockCode === stockCode);

  if (!meta) {
    notFound();
  }

  const basicInfo: OverseasStockBasicInfoResponse['output'] | null =
    stockInfo?.output ?? null;

  const price =
    basicInfo && basicInfo.ovrs_now_pric1
      ? Number(basicInfo.ovrs_now_pric1)
      : null;
  const shares =
    basicInfo && basicInfo.lstg_stck_num
      ? Number(basicInfo.lstg_stck_num)
      : null;

  const marketCap =
    price !== null &&
    shares !== null &&
    !Number.isNaN(price) &&
    !Number.isNaN(shares)
      ? price * shares
      : null;

  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-[480px] space-y-6">
        <StockDetailCard
          meta={meta}
          price={price}
          marketCap={marketCap}
          basicInfo={basicInfo}
          tickerSymbol={pdno}
        />
      </div>
    </div>
  );
};

export default StockDetailPage;
