'use client';

import { Button } from '@/components/ui/button';
import { createFetcher } from '@/lib/fetcher';
import { useCallback, useRef, useState } from 'react';

const appApiFetcher = createFetcher({ baseUrl: '' });

type StockSentimentAnalyzeButtonProps = {
  stockId: string;
  className?: string;
};

export function StockSentimentAnalyzeButton({
  stockId,
  className,
}: StockSentimentAnalyzeButtonProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const analyzingRef = useRef(false);

  const handleAnalyze = useCallback(async () => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    try {
      const data = await appApiFetcher.post<{
        status: string;
        data?: unknown;
      }>('/api/analysis', { stock_id: stockId });
      console.log(data);
    } catch (e) {
      console.error(e);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, [stockId]);

  return (
    <Button
      onClick={handleAnalyze}
      disabled={analyzing}
      className={className}
      variant="secondary"
    >
      {analyzing ? '분석 중…' : '감정 분석'}
    </Button>
  );
}
