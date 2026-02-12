'use client';

import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createFetcher } from '@/lib/fetcher';
import { useCallback, useRef, useState } from 'react';

const appApiFetcher = createFetcher({ baseUrl: '' });

type SentimentKorean = {
  dominant_sentiment: string;
  average_score: string;
  sentiment_distribution: Array<{
    sentiment: string;
    percentage: string;
    count: number;
  }>;
  overall_confidence: string;
  sentiment_strength: string;
  total_analyzed: number;
};

type AnalyzeResponse = {
  status: string;
  data?: {
    overall_sentiment: { korean: SentimentKorean };
    top_keywords: string[];
  };
};

const SENTIMENT_BADGE_VARIANT: Record<string, BadgeVariant> = {
  긍정: 'positive',
  '다소 긍정': 'slightly-positive',
  중립: 'neutral',
  '다소 부정': 'slightly-negative',
  부정: 'destructive',
};

type StockCommunitySentimentSectionProps = {
  stockId: string;
};

export function StockCommunitySentimentSection({
  stockId,
}: StockCommunitySentimentSectionProps) {
  const [result, setResult] = useState<AnalyzeResponse['data'] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzingRef = useRef(false);

  const handleAnalyze = useCallback(async () => {
    if (analyzingRef.current) return;
    analyzingRef.current = true;
    setAnalyzing(true);
    try {
      const data = await appApiFetcher.post<AnalyzeResponse>('/api/analysis', {
        stock_id: stockId,
      });
      if (data.status === 'success' && data.data) setResult(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }, [stockId]);

  const korean = result?.overall_sentiment?.korean;
  const topKeywords = result?.top_keywords ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={analyzing}
          variant="primary"
          className="shrink-0 cursor-pointer"
        >
          {analyzing ? '분석 중…' : '감정 분석'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-semibold">
            커뮤니티 감정 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <p className="text-sm text-muted-foreground">
              &apos;감정분석&apos; 버튼을 눌러 커뮤니티 기반 감정을 불러오세요.
            </p>
          ) : korean ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    SENTIMENT_BADGE_VARIANT[korean.dominant_sentiment] ??
                    'secondary'
                  }
                >
                  {korean.dominant_sentiment}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  평균 점수 {korean.average_score} · {korean.sentiment_strength}{' '}
                  · {korean.total_analyzed}건 분석
                </span>
              </div>
              {korean.sentiment_distribution.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {korean.sentiment_distribution.map((d) => (
                    <span
                      key={d.sentiment}
                      className="text-xs text-muted-foreground"
                    >
                      {d.sentiment} {d.percentage}%
                    </span>
                  ))}
                </div>
              )}
              {topKeywords.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  주요 키워드: {topKeywords.join(', ')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              분석 결과가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
