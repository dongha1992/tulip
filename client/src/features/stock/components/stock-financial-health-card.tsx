import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CircleX } from 'lucide-react';
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import type { CompanyFactsResponse } from '../types';
import {
  computeFinancialHealthChecklist,
  fmtMoney,
} from '../utils/stock-financial-health';
import { formatPct01 } from '../utils/stock-ownership';

type FinancialHealthCardProps = {
  facts: CompanyFactsResponse;
  showDetail?: boolean;
  yahoo?: QuoteSummaryResult | null;
};

export function FinancialHealthCard({
  facts,
  showDetail = false,
  yahoo = null,
}: FinancialHealthCardProps) {
  const r = computeFinancialHealthChecklist(facts, { yahoo });

  const passCut = Math.ceil(r.items.length * 0.6);

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[20px] font-semibold">
            재무 건전성
          </CardTitle>
        </div>

        <Badge
          variant={r.score >= passCut ? 'slightly-positive' : 'destructive'}
        >
          {r.score}/{r.items.length}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-[13px] text-muted-foreground">
          {r.asOf ? `기준일 ${r.asOf}` : ''}
        </p>
        {r.items.map((it) => (
          <div
            key={it.key}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{it.label}</p>
              {showDetail && it.detail && (
                <p className="mt-1 break-words text-13 text-muted-foreground">
                  {it.detail}
                </p>
              )}
            </div>

            <Badge variant={it.pass ? 'slightly-positive' : 'destructive'}>
              {it.pass ? <Check color="green" /> : <CircleX color="red" />}
            </Badge>
          </div>
        ))}

        {/* 핵심 정보 */}
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium">핵심 재무</p>
            {r.asOf ? (
              <span className="text-[13px] text-muted-foreground">
                {r.asOf}
              </span>
            ) : null}
          </div>

          {/* 가장 중요한 두 개를 상단에 크게 표시 */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[13px] text-muted-foreground">
                부채/자본 비율
              </p>
              <p className="text-lg font-semibold text-foreground">
                {r.keyFacts.debtToEquityPct == null
                  ? 'n/a'
                  : formatPct01(r.keyFacts.debtToEquityPct)}
              </p>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <p className="text-[13px] text-muted-foreground">부채</p>
              <p className="text-lg font-semibold text-foreground">
                {fmtMoney(r.keyFacts.debt)}
              </p>
            </div>
          </div>

          {/* 나머지 정보는 자산(왼쪽) / 부채·자본(오른쪽)으로 정리 */}
          <div className="mt-3 grid grid-cols-2 gap-4 text-[13px] text-muted-foreground">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span>현금</span>
                <span className="text-foreground">
                  {fmtMoney(r.keyFacts.cash)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>총자산</span>
                <span className="text-foreground">
                  {fmtMoney(r.keyFacts.totalAssets)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>순자산(자산-부채)</span>
                <span className="text-foreground">
                  {r.keyFacts.totalAssets != null &&
                  r.keyFacts.totalLiabilities != null
                    ? fmtMoney(
                        r.keyFacts.totalAssets - r.keyFacts.totalLiabilities,
                      )
                    : 'n/a'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span>자본</span>
                <span className="text-foreground">
                  {fmtMoney(r.keyFacts.equity)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span>총부채</span>
                <span className="text-foreground">
                  {fmtMoney(r.keyFacts.totalLiabilities)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {r.summaryText && (
          <p className="text-sm font-medium text-muted-foreground whitespace-pre-line">
            {r.summaryText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
