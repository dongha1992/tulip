import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WallRow = {
  strike: number;
  oi: number;
};

type StockOptionsCardProps = {
  spot: number | null;
  expiration: string | null;
  callWalls: WallRow[];
  putWalls: WallRow[];
  maxPain: number | null;
};

export function StockOptionsCard({
  expiration,
  callWalls,
  putWalls,
  maxPain,
}: StockOptionsCardProps) {
  const fmtStrike = (v: number | null) =>
    v == null || Number.isNaN(v) ? 'n/a' : `$${v.toFixed(2)}`;

  const fmtOi = (v: number | null) =>
    v == null || Number.isNaN(v) ? 'n/a' : v.toLocaleString();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          옵션 포지션 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-md bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground">기준 만기</span>
          <span className="font-semibold">{expiration}</span>
        </div>

        <span className="text-[12px] font-medium">Call OI 상위 3개</span>
        <div className="rounded-md bg-muted/40 p-2">
          {callWalls.length ? (
            <div className="space-y-1 text-xs">
              {callWalls.map((w) => (
                <div
                  key={`call-${w.strike}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">
                    {fmtStrike(w.strike)}
                  </span>
                  <span className="font-semibold">{fmtOi(w.oi)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">데이터 없음</p>
          )}
        </div>

        <span className="text-[12px] font-medium">Put OI 상위 3개</span>
        <div className="rounded-md bg-muted/40 p-2">
          {putWalls.length ? (
            <div className="space-y-1 text-xs">
              {putWalls.map((w) => (
                <div
                  key={`put-${w.strike}`}
                  className="flex items-center justify-between"
                >
                  <span className="text-muted-foreground">
                    {fmtStrike(w.strike)}
                  </span>
                  <span className="font-semibold">{fmtOi(w.oi)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">데이터 없음</p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/40 p-2">
          <span className="text-[11px] text-muted-foreground">Max Pain</span>
          <span className="font-semibold">{fmtStrike(maxPain)}</span>
        </div>

        <p className="text-[10px] leading-snug text-muted-foreground">
          OI(Open Interest)는 아직 청산되지 않은 계약 수(미결제약정)로, 각 행의
          물량은 해당 행사가에 쌓인 계약 개수를 의미합니다.
        </p>
      </CardContent>
    </Card>
  );
}
