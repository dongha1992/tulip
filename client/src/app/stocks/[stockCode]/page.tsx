import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockDetailCard } from '@/features/stock/components/stock-detail-card';
import { getStockInfo } from '@/features/stock/queries/get-stock-info';
import { getStocksMetaInfo } from '@/features/stock/queries/get-stocks-meta-info';
import type { OverseasStockBasicInfoResponse } from '@/features/stock/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

type StockDetailPageProps = {
  params: Promise<{
    stockCode: string;
  }>;
  searchParams: Promise<{
    PRDT_TYPE_CD?: string;
    PDNO?: string;
    EXCD?: string;
  }>;
};

const StockDetailPage = async ({
  params,
  searchParams,
}: StockDetailPageProps) => {
  const { stockCode } = await params;
  const resolvedSearchParams = await searchParams;
  const productTypeCode = resolvedSearchParams.PRDT_TYPE_CD;
  const excd = resolvedSearchParams.EXCD;
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

  if (!meta || meta.ticker === '') {
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
    <div className="flex-1 flex justify-center">
      <div className="w-full max-w-5xl px-4 py-4 md:py-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex-1">
            <StockDetailCard
              meta={meta}
              price={price}
              marketCap={marketCap}
              tickerSymbol={meta.ticker}
              pdno={pdno}
              excd={excd ?? null}
            />
          </div>

          <aside className="w-full md:w-[280px] space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">광고</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  추후 파트너사·서비스 추천 영역으로 사용할 수 있는 자리입니다.
                </p>
                <p>
                  예: 브로커 프로모션, 리서치 리포트, 관련 종목 배너 등을 넣을
                  수 있습니다.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;
