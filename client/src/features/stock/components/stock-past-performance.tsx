import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CircleX } from 'lucide-react';
import type { CompanyFactsResponse } from '../types';
import { computePastChecklistSimplyStyle } from '../utils/stock-past-info'; // 같은 파일이면 경로 조정
type PastPerformanceCardProps = {
  facts: CompanyFactsResponse;
  showDetail?: boolean;
};

export function PastPerformanceCard({
  facts,
  showDetail = false,
}: PastPerformanceCardProps) {
  const r = computePastChecklistSimplyStyle(facts);

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            과거 순이익 실적
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            과거 기준 점검 {r.score}/5{' '}
            {r.recentEnd ? `· 기준일 ${r.recentEnd}` : ''}
          </p>
        </div>

        <Badge variant={r.score >= 3 ? 'default' : 'destructive'}>
          {r.score}/5
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2">
        {r.items.map((it) => (
          <div
            key={it.key}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{it.label}</p>
              {showDetail && it.detail && (
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {it.detail}
                </p>
              )}
            </div>

            <Badge variant={it.pass ? 'default' : 'destructive'}>
              {it.pass ? <Check color="green" /> : <CircleX color="red" />}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
