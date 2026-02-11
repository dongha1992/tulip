'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getShortInterest } from '@/features/stock/queries/get-short-interest';
import {
  formatPct01,
  formatShares,
} from '@/features/stock/utils/stock-ownership';
import { useState } from 'react';

type Props = {
  excd: string | null;
  symb: string | null;
  shortPercentOfFloat?: number | null;
  sharesShort?: number | null;
  sharesOutstanding?: number | null;
};

type ShortInterestData = {
  updated: string | null;
  fee2: string | null;
  available: string | null;
  rebate3: string | null;
};

export function StockShortInterestCard({
  excd,
  symb,
  shortPercentOfFloat,
  sharesShort,
  sharesOutstanding,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ShortInterestData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!excd || !symb) {
      setError('심볼 정보가 없어 공매도 데이터를 불러올 수 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getShortInterest(excd, symb);

      setData({
        updated: result.updated,
        fee2: result.fee2,
        available: result.available,
        rebate3: result.rebate3,
      });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '공매도 데이터 로딩에 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-[20px] font-semibold">공매도</CardTitle>
        <button
          type="button"
          onClick={handleLoad}
          disabled={loading}
          className="text-sm text-green underline disabled:opacity-50 cursor-pointer"
        >
          {loading ? '불러오는 중...' : '상세 데이터 불러오기'}
        </button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {error && <p className="text-xs text-destructive">{error}</p>}

        {/* Yahoo 기반: 전체 유통주식 대비 공매도 비율  */}
        {(shortPercentOfFloat != null ||
          sharesShort != null ||
          sharesOutstanding != null) && (
          <div className="space-y-1 rounded-md bg-muted/40 p-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-[15px] font-medium mb-1">
                전체 유통주식 대비 공매도 비율
              </span>
              <span className="text-sm font-medium font-semibold">
                {shortPercentOfFloat != null
                  ? formatPct01(shortPercentOfFloat)
                  : 'n/a'}
              </span>
            </div>
            <div className="flex justify-between text-[12px] text-muted-foreground mb-1">
              <span>공매도 주식 수 (추정)</span>
              <span>
                {sharesShort != null ? formatShares(sharesShort) : 'n/a'}
              </span>
            </div>
            {sharesOutstanding != null && (
              <div className="flex justify-between text-[12px] text-muted-foreground">
                <span>발행주식수(또는 유통주식수)</span>
                <span>{formatShares(sharesOutstanding)}</span>
              </div>
            )}
          </div>
        )}

        {/* ChartExchange/IB 기반 Borrow Fee 섹션 (버튼 클릭 시 로딩) */}
        {data ? (
          <>
            <p className="text-[13px] text-muted-foreground pt-6">
              {data.updated
                ? `기준일 ${data.updated}`
                : 'Borrow fee 데이터가 없습니다.'}
            </p>
            <div className="flex justify-between">
              <span className="text-sm font-medium ">
                차입 수수료율 (Borrow Fee)
              </span>
              <span className="font-semibold">{data.fee2 ?? 'n/a'}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium ">
                대차 가능 주식 수 (Available Shares)
              </span>
              <span className="font-semibold">{data.available ?? 'n/a'}주</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium ">리베이트율 (Rebate)</span>
              <span className="font-semibold">{data.rebate3 ?? 'n/a'}%</span>
            </div>

            <div className="mt-6 space-y-3 text-[12px] text-muted-foreground">
              <p>
                1) Interactive Brokers에서 제공하는 데이터로, 약 15분마다
                갱신됩니다. 업데이트가 없다면 현재는 대여 가능한 주식이 없는
                상태일 수 있습니다.
              </p>
              <p>
                2) Stock loan fee(= borrow fee, borrow rate, cost to borrow)는
                공매도를 위해 주식을 빌리는 투자자가 브로커리지에 지불하는
                수수료입니다.
              </p>
              <p>
                3) Stock loan rebate는 주식을 빌려준 투자자에게 브로커가
                지급하는 이자 성격의 금액입니다. Rebate가 양수면 대여자가
                브로커에게 이자를 내는 구조이고, 음수면 해당 종목이
                hard-to-borrow 상태라 브로커가 대여자에게 이자를 지급합니다.
              </p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
