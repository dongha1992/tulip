import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StocksMetaInfoResponse } from '@/features/stock/types';
import Image from 'next/image';
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import { buildSummaryDTO } from '../dto/stock-info';
import { buildOwnershipBreakdownDTO } from '../dto/stock-ownership';
import { getCompanyFacts } from '../queries/get-company-facts';
import { getSecCompanyTicker } from '../queries/get-sec-company-ticker';
import { getYahooQuoteSummary } from '../queries/get-yahoo-stock-forecast';
import type { CompanyFactsResponse, SecCompanyTickerMap } from '../types';
import type { OptionsSnapshot } from '../utils/stock-options';
import { buildOptionsSnapshot } from '../utils/stock-options';
import { FinancialHealthCard } from './financial-health-card';
import { FuturePerformanceCard } from './stock-future-performance';
import { StockOptionsCard } from './stock-options-card';
import { OwnershipCard } from './stock-ownership';
import { PastPerformanceCard } from './stock-past-performance';
import { StockShortInterestCard } from './stock-short-interest-card';

type StockDetailCardProps = {
  meta: StocksMetaInfoResponse;

  price: number | null;
  marketCap: number | null;
  excd: string | null;
  pdno: string | null;
  tickerSymbol: string | null;
};

function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'n/a';
  return `$${Math.round(value).toLocaleString()}`;
}

function getYahooNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (
    v &&
    typeof v === 'object' &&
    'raw' in (v as { raw?: unknown }) &&
    typeof (v as { raw?: unknown }).raw === 'number' &&
    Number.isFinite((v as { raw: number }).raw)
  ) {
    return (v as { raw: number }).raw;
  }
  return undefined;
}

const StockDetailCard = async ({
  meta,
  excd,
  pdno,
  tickerSymbol,
  price,
  marketCap,
}: StockDetailCardProps) => {
  let dto: ReturnType<typeof buildSummaryDTO> = null;
  let companyFacts: CompanyFactsResponse | null = null;
  let yahoo: QuoteSummaryResult | null = null;
  let ownershipDto = null as ReturnType<
    typeof buildOwnershipBreakdownDTO
  > | null;

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
      dto = buildSummaryDTO(companyFacts);
    }

    yahoo = await getYahooQuoteSummary(tickerSymbol ?? '');
    ownershipDto = buildOwnershipBreakdownDTO(yahoo);
  }

  if (!companyFacts) {
    return null;
  }

  if (!yahoo) {
    return null;
  }

  const optionsSnapshot: OptionsSnapshot | null =
    (await buildOptionsSnapshot(tickerSymbol, yahoo)) ?? null;

  // Yahoo 기반 공매도 비율/공매도 주식 수
  const rawShortPercentOfFloat =
    getYahooNumber(yahoo.summaryDetail?.shortPercentOfFloat) ?? null;

  const sharesShort = getYahooNumber(
    (
      yahoo.defaultKeyStatistics as unknown as {
        sharesShort?: unknown;
      }
    )?.sharesShort,
  );

  const sharesOutstanding = getYahooNumber(
    (
      yahoo.defaultKeyStatistics as unknown as {
        sharesOutstanding?: unknown;
      }
    )?.sharesOutstanding,
  );

  const shortPercentOfFloat =
    rawShortPercentOfFloat != null
      ? rawShortPercentOfFloat
      : sharesShort != null &&
          sharesOutstanding != null &&
          sharesOutstanding !== 0
        ? sharesShort / sharesOutstanding
        : null;

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center gap-4 mb-2">
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
          <CardTitle className="text-[28px] font-semibold mb-1">
            {meta.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {tickerSymbol?.toUpperCase()}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 주가 */}
        {price !== null && !Number.isNaN(price) && (
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">${price.toLocaleString()}</p>
            <span className="text-sm text-muted-foreground">현재가</span>
          </div>
        )}

        {/* 시가총액 */}
        {marketCap !== null && !Number.isNaN(marketCap) && (
          <div className="text-sm text-muted-foreground">
            시가총액{' '}
            <span className="font-semibold text-foreground">
              {formatUsd(marketCap)}
            </span>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-[20px] font-semibold">
              SEC 기반 요약
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dto ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <p className="text-[13px] text-muted-foreground">
                    {dto.recentUpdateEnd
                      ? `기준일 ${dto.recentUpdateEnd}`
                      : '기준일 정보 없음'}
                  </p>
                </div>
                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
                    TTM 매출
                  </p>
                  <p className="font-semibold">{formatUsd(dto.revenueTtm)}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
                    TTM 순이익
                  </p>
                  <p className="font-semibold">{formatUsd(dto.netIncomeTtm)}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
                    순이익률
                  </p>
                  <p className="font-semibold">{dto.netMarginPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">ROE</p>
                  <p className="font-semibold">{dto.roePct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
                    매출 CAGR (5Y)
                  </p>
                  <p className="font-semibold">{dto.revenueCagr5yPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
                    순이익 CAGR (5Y)
                  </p>
                  <p className="font-semibold">{dto.netIncomeCagr5yPct}</p>
                </div>

                <div className="rounded-md bg-muted/40 p-2 col-span-2">
                  <p className="text-[14px] text-muted-foreground mb-1">
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
        {ownershipDto && <OwnershipCard dto={ownershipDto} showDetail />}
        <FinancialHealthCard
          facts={companyFacts}
          yahoo={yahoo}
          showDetail={false}
        />
        <StockOptionsCard
          spot={optionsSnapshot?.spot ?? null}
          expiration={optionsSnapshot?.expiration ?? null}
          callWalls={optionsSnapshot?.callWalls ?? []}
          putWalls={optionsSnapshot?.putWalls ?? []}
          maxPain={optionsSnapshot?.maxPain ?? null}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-[20px] font-semibold">
              커뮤니티 감정 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant="destructive">극단적 부정</Badge>
            </div>
          </CardContent>
        </Card>

        <StockShortInterestCard
          excd={excd}
          symb={pdno ?? meta.ticker}
          shortPercentOfFloat={shortPercentOfFloat}
          sharesShort={sharesShort}
          sharesOutstanding={sharesOutstanding}
        />
      </CardContent>
    </Card>
  );
};

export { StockDetailCard };
