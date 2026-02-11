import { StockRankItem } from '@/components/stock-rank-item';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  getPriceChangeInfo,
  getSearchStock,
} from '../queries/get-search-stock';
import { getStocksMetaInfo } from '../queries/get-stocks-meta-info';
import { getTradeAmountRanking } from '../queries/get-trade-amount-ranking';
import type { ParsedStockSearchParams } from '../search-params';
import type { StocksMetaInfoResponse, TradeAmountRankingItem } from '../types';
import { StockPagination } from './stock-pagination';
import StockSearchInput from './stock-search-input';

type StockListProps = {
  searchParams: ParsedStockSearchParams;
};

export type StockRankMatch = {
  rankingItem: TradeAmountRankingItem;
  meta: StocksMetaInfoResponse;
};

function mapExcdToProductTypeCode(excd: string): string {
  const mapping: Record<string, string> = {
    NAS: '512', // 미국 나스닥
    NYS: '513', // 미국 뉴욕
    AMS: '529', // 미국 아멕스
  };
  return mapping[excd] ?? '';
}

function matchRankingByName(
  output2: TradeAmountRankingItem[],
  stocksMetaInfo: StocksMetaInfoResponse[],
): StockRankMatch[] {
  const nameToMeta = new Map(stocksMetaInfo.map((m) => [m.name, m]));
  const result: StockRankMatch[] = [];
  for (const item of output2) {
    const meta = nameToMeta.get(item.name);
    if (meta) result.push({ rankingItem: item, meta });
  }
  return result;
}

const StockList = async ({ searchParams }: StockListProps) => {
  const hasSearch = Boolean(searchParams.search?.trim());

  if (!hasSearch) {
    const [stocksMetaInfo, tradeAmountRanking] = await Promise.all([
      getStocksMetaInfo(searchParams),
      getTradeAmountRanking(),
    ]);

    const allMatches = matchRankingByName(
      tradeAmountRanking.output2,
      stocksMetaInfo,
    );

    const { page, size } = searchParams;
    const start = page * size;
    const list = allMatches.slice(start, start + size);
    const count = allMatches.length;
    const hasNextPage = start + size < count;

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">필터 추가 예정</p>
        <ul className="space-y-4">
          <StockSearchInput placeholder="검색어를 입력하세요" />

          {list.map(({ rankingItem, meta }, i) => (
            <StockRankItem
              key={`${meta.stockCode}-${i}`}
              href={`/stocks/${encodeURIComponent(
                meta.stockCode,
              )}?${new URLSearchParams({
                PRDT_TYPE_CD: mapExcdToProductTypeCode(rankingItem.excd),
                PDNO: rankingItem.symb,
              }).toString()}`}
              title={meta.name}
              description={`현재가 $${Number(
                rankingItem.last,
              ).toLocaleString()}`}
              icon={
                meta.logoImageUrl ? (
                  <Image
                    src={meta.logoImageUrl}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    width={48}
                    height={48}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {meta.name.slice(0, 2)}
                  </div>
                )
              }
              badge={
                <Badge
                  variant={
                    rankingItem.rate.startsWith('-')
                      ? 'destructive'
                      : 'positive'
                  }
                >
                  {rankingItem.rate}%
                </Badge>
              }
            />
          ))}
        </ul>
        <div className="flex justify-center">
          <StockPagination paginatedMetadata={{ count, hasNextPage }} />
        </div>
      </div>
    );
  }

  const stocksMetaInfo = await getStocksMetaInfo(searchParams);
  const firstMeta = stocksMetaInfo[0];

  if (!firstMeta) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">필터 추가 예정</p>
        <ul className="space-y-4">
          <StockSearchInput placeholder="검색어를 입력하세요" />
          <li className="text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </li>
        </ul>
      </div>
    );
  }

  const priceDetail = await getSearchStock({
    AUTH: '',
    EXCD: firstMeta.EXCD,
    SYMB: firstMeta.ticker,
  });

  const { output } = priceDetail;
  const changeInfo = getPriceChangeInfo(output);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">필터 추가 예정</p>
      <ul className="space-y-4">
        <StockSearchInput placeholder="검색어를 입력하세요" />

        <StockRankItem
          key={firstMeta.stockCode}
          href={`/stocks/${encodeURIComponent(
            firstMeta.stockCode,
          )}?${new URLSearchParams({
            PRDT_TYPE_CD: mapExcdToProductTypeCode(firstMeta.EXCD),
            PDNO: firstMeta.ticker,
          }).toString()}`}
          title={firstMeta.name}
          description={`현재가 $${Number(output.last).toLocaleString()}
          `}
          icon={
            firstMeta.logoImageUrl ? (
              <Image
                src={firstMeta.logoImageUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-full object-cover"
                width={48}
                height={48}
                loading="lazy"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {firstMeta.name.slice(0, 2)}
              </div>
            )
          }
          badge={
            <Badge
              variant={
                changeInfo && changeInfo.isNegative ? 'destructive' : 'positive'
              }
            >
              {changeInfo ? `${changeInfo.rateText}%` : 'n/a'}
            </Badge>
          }
        />
      </ul>
    </div>
  );
};

export { StockList };
