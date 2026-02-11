import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OwnershipBreakdownDTO } from '../types';
import { formatPct01, formatShares } from '../utils/stock-ownership';

type OwnershipCardProps = {
  dto: OwnershipBreakdownDTO;
  showDetail?: boolean;
};

export function OwnershipCard({ dto, showDetail = false }: OwnershipCardProps) {
  const hasCore =
    dto.rows.some((r) => r.pct != null) && dto.sharesOutstanding != null;

  const totalPct = dto.rows.reduce((acc, r) => acc + (r.pct ?? 0), 0);

  // 지분율(pct) 기준 내림차순 정렬 (값 없으면 맨 뒤)
  const sortedRows = [...dto.rows].sort((a, b) => {
    const ap = a.pct ?? -1;
    const bp = b.pct ?? -1;
    return bp - ap;
  });

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-[20px] font-semibold">지분 구분</CardTitle>
        </div>

        <Badge variant={hasCore ? 'outline' : 'destructive'}>
          {hasCore ? `합계 ${formatPct01(totalPct)}` : '지분 정보 없음'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="text-[13px] text-muted-foreground">
          {dto.asOf ? `기준일 ${dto.asOf}` : ''}
        </p>
        {sortedRows.map((r) => (
          <div
            key={r.key}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-medium">{r.label}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                주식 수 {formatShares(r.shares)} · 지분율 {formatPct01(r.pct)}
              </p>

              {showDetail && r.key === 'other' && (
                <p className="mt-1 break-words text-[12px] text-muted-foreground">
                  * Yahoo 데이터만으로 정부/공공기관을 별도 분리하기 어려워
                  나머지 지분을 “기타/일반(추정)”으로 표시합니다.
                </p>
              )}
            </div>

            <Badge variant={r.pct != null ? 'outline' : 'destructive'}>
              {formatPct01(r.pct)}
            </Badge>
          </div>
        ))}

        {showDetail && (
          <div className="rounded-md bg-muted/40 p-2">
            <p className="text-[12px] text-muted-foreground mb-1">
              총 발행주식수
            </p>
            <p className="font-semibold">
              {formatShares(dto.sharesOutstanding)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
