import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CircleX } from 'lucide-react';
import type { QuoteSummaryResult } from 'yahoo-finance2/modules/quoteSummary';
import type { CompanyFactsResponse } from '../types';
import { computeFutureChecklistStyle } from '../utils/stock-future-info';

type FuturePerformanceCardProps = {
  facts: CompanyFactsResponse;
  yahoo: QuoteSummaryResult;
  showDetail?: boolean;
  savingsRate?: number; // ex) 0.03
  highGrowthThreshold?: number; // ex) 0.2
  roeThreshold?: number; // ex) 0.2
};

export function FuturePerformanceCard({
  facts,
  yahoo,
  showDetail = true,
  savingsRate = 0.03,
  highGrowthThreshold = 0.2,
  roeThreshold = 0.2,
}: FuturePerformanceCardProps) {
  const r = computeFutureChecklistStyle(facts, yahoo, {
    savingsRate,
    highGrowthThreshold,
    roeThreshold,
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[20px] font-semibold">향후 성장</CardTitle>
        </div>

        <Badge
          variant={
            r.score >= Math.ceil(r.items.length * 0.6)
              ? 'slightly-positive'
              : 'destructive'
          }
        >
          {r.score} / {r.items.length}
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
                <p className="mt-1 break-words text-[13px] text-muted-foreground">
                  {it.detail}
                </p>
              )}
            </div>

            <Badge variant={it.pass ? 'slightly-positive' : 'destructive'}>
              {it.pass ? <Check color="green" /> : <CircleX color="red" />}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
