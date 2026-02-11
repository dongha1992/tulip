import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  OverseasStockBasicInfoResponse,
  StocksMetaInfoResponse,
} from '@/features/stock/types';
import Image from 'next/image';
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import { buildSimplySummaryDTO } from '../dto/stock-info';
import { getCompanyFacts } from '../queries/get-company-facts';
import { getSecCompanyTicker } from '../queries/get-sec-company-ticker';
import { getYahooQuoteSummary } from '../queries/get-yahoo-stock-forecast';
import type { CompanyFactsResponse, SecCompanyTickerMap } from '../types';
import { FuturePerformanceCard } from './stock-future-performance';
import { PastPerformanceCard } from './stock-past-performance';

type StockDetailCardProps = {
  meta: StocksMetaInfoResponse;
  /** 주가 (현재가) */
  price: number | null;

  /** 시가총액 */
  marketCap: number | null;
  basicInfo: OverseasStockBasicInfoResponse['output'] | null;
  tickerSymbol: string | null;
};

const StockDetailCard = async ({
  meta,
  basicInfo,
  tickerSymbol,
  price,
  marketCap,
}: StockDetailCardProps) => {
  let dto: ReturnType<typeof buildSimplySummaryDTO> = null;
  let companyFacts: CompanyFactsResponse | null = null;
  let yahoo: QuoteSummaryResult | null = null;

  if (tickerSymbol) {
    const secTickers = (await getSecCompanyTicker()) as SecCompanyTickerMap;
    const upper = tickerSymbol.toUpperCase();
    const match = Object.values(secTickers).find(
      (entry) => entry.ticker.toUpperCase() === upper,
    );

    const cik = match?.cik_str ?? '';
    if (cik) {
      companyFacts = await getCompanyFacts(cik);
      if (!companyFacts) return null;
      dto = buildSimplySummaryDTO(companyFacts);
    }

    yahoo = await getYahooQuoteSummary(tickerSymbol ?? '');
  }

  if (!companyFacts) {
    return null;
  }

  if (!yahoo) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center gap-4">
        {meta.logoImageUrl ? (
          <Image
            src={meta.logoImageUrl}
            alt={meta.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
            {meta.name.slice(0, 2)}
          </div>
        )}
        <div>
          <CardTitle className="text-xl font-semibold">{meta.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{meta.stockCode}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 주가 */}
        {price !== null && !Number.isNaN(price) && (
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{price.toLocaleString()}</p>
            <span className="text-xs text-muted-foreground">현재가</span>
          </div>
        )}

        {/* 시가총액 */}
        {marketCap !== null && !Number.isNaN(marketCap) && (
          <div className="text-sm text-muted-foreground">
            시가총액{' '}
            <span className="font-semibold text-foreground">
              {marketCap.toLocaleString()}
            </span>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-semibold">
              SEC 기반 요약
            </CardTitle>
            {dto?.recentUpdateEnd ? (
              <Badge variant="secondary" className="text-[11px]">
                {dto.recentUpdateEnd}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px]">
                n/a
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dto ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">TTM 매출</p>
                  <p className="font-semibold">
                    {dto.revenueTtm != null
                      ? dto.revenueTtm.toLocaleString()
                      : 'n/a'}
                  </p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">
                    TTM 순이익
                  </p>
                  <p className="font-semibold">
                    {dto.netIncomeTtm != null
                      ? dto.netIncomeTtm.toLocaleString()
                      : 'n/a'}
                  </p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">순이익률</p>
                  <p className="font-semibold">{dto.netMarginPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">ROE</p>
                  <p className="font-semibold">{dto.roePct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">
                    매출 CAGR (5Y)
                  </p>
                  <p className="font-semibold">{dto.revenueCagr5yPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[11px] text-muted-foreground">
                    순이익 CAGR (5Y)
                  </p>
                  <p className="font-semibold">{dto.netIncomeCagr5yPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2 col-span-2">
                  <p className="text-[11px] text-muted-foreground">
                    EPS CAGR (5Y)
                  </p>
                  <p className="font-semibold">{dto.epsCagr5yPct}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                SEC Company Facts 매칭 실패(티커/CIK/태그)로 지표를 계산하지
                못했습니다.
              </p>
            )}
          </CardContent>
        </Card>
        <PastPerformanceCard facts={companyFacts} showDetail={false} />
        <FuturePerformanceCard facts={companyFacts} yahoo={yahoo} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              커뮤니티 감정 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="destructive">극단적 부정</Badge>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export { StockDetailCard };
