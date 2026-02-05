import { checkRateLimit } from '@/utils/rate-limit';
import { NextResponse } from 'next/server';

// TODO: 임시 로컬: http://127.0.0.1, 배포: Cloud Run URL
const isDev = process.env.NODE_ENV === 'development';

const CRAWLER_BASE =
  process.env.CRAWLER_URL?.replace(/\/$/, '') ??
  (isDev ? 'http://127.0.0.1:8080' : '');
// 크롤러 8080, 분석 8081
const ANALYSIS_BASE =
  process.env.ANALYSIS_URL?.replace(/\/$/, '') ??
  (isDev ? 'http://127.0.0.1:8081' : '');

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { stock_id } = await req.json();

    if (!stock_id) {
      return NextResponse.json(
        { error: 'stock_id는 필수입니다.' },
        { status: 400 },
      );
    }

    if (!CRAWLER_BASE || !ANALYSIS_BASE) {
      return NextResponse.json(
        { error: 'CRAWLER_URL and ANALYSIS_URL must be configured' },
        { status: 500 },
      );
    }

    // 1. 크롤링
    const body = { stock_id, max_scrolls: 5, save: true };

    const crawlRes = await fetch(`${CRAWLER_BASE}/crawl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!crawlRes.ok) {
      const err = await crawlRes.text();
      throw new Error(`Crawl failed: ${err}`);
    }

    const { feeds: stockFeeds } = await crawlRes.json();
    console.log(stockFeeds);
    const texts = stockFeeds
      .map((feed: unknown) => (feed as { text: string }).text)
      .filter(Boolean);

    if (texts.length === 0) {
      return NextResponse.json({
        status: 'success',
        data: {
          individual_results: [],
          overall_sentiment: {
            korean: {
              dominant_sentiment: '중립',
              average_score: '50.00',
              sentiment_distribution: [],
              overall_confidence: '낮음',
              sentiment_strength: '보통',
              total_analyzed: 0,
            },
          },
        },
      });
    }

    // 2. 감정 분석
    const analysisRes = await fetch(`${ANALYSIS_BASE}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!analysisRes.ok) {
      const err = await analysisRes.text();
      throw new Error(`Analysis failed: ${err}`);
    }

    const sentimentResponse = await analysisRes.json();

    const koreanResults = sentimentResponse.map(
      (result: {
        score: number;
        label: string;
        confidence: number;
        class_probabilities: { [key: string]: number };
      }) => ({
        sentiment_score: result.score.toFixed(2),
        positive_percent: result.score.toFixed(2),
        negative_percent: (100 - result.score).toFixed(2),
        detailed_sentiment: result.label,
        confidence: result.confidence,
        overall_sentiment: result.label,
        class_probabilities: result.class_probabilities,
        sentiment_strength: getSentimentStrength(result.score),
      }),
    );

    const sentimentResults = texts.map((text: string, index: number) => ({
      text,
      korean_sentiment: koreanResults[index],
    }));

    const koreanOverall = determineOverallSentiment(koreanResults);

    return NextResponse.json({
      status: 'success',
      data: {
        individual_results: sentimentResults,
        overall_sentiment: {
          korean: koreanOverall,
        },
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// 감정 강도를 판단하는 함수 추가
function getSentimentStrength(score: number): string {
  if (score >= 75) return '매우 강함';
  if (score >= 55) return '강함';
  if (score > 45) return '보통';
  if (score >= 25) return '약함';
  return '매우 약함';
}

function determineOverallSentiment(
  results: {
    sentiment_score: string;
    detailed_sentiment: string;
    confidence: number;
    class_probabilities: {
      [key: string]: number;
    };
  }[],
) {
  const sentimentCounts = results.reduce(
    (
      acc: { [key: string]: number },
      result: { detailed_sentiment: string },
    ) => {
      acc[result.detailed_sentiment] =
        (acc[result.detailed_sentiment] || 0) + 1;
      return acc;
    },
    {},
  );

  const totalCount = results.length;
  const sentimentPercentages = Object.entries(sentimentCounts).map(
    ([sentiment, count]: [string, number]) => ({
      sentiment,
      percentage: ((count / totalCount) * 100).toFixed(2),
      count,
    }),
  );

  const averageScore =
    results.reduce(
      (sum: number, result: { sentiment_score: string }) =>
        sum + parseFloat(result.sentiment_score),
      0,
    ) / totalCount;

  const dominantSentiment = sentimentPercentages.reduce(
    (
      max: { percentage: string; sentiment: string; count: number },
      sentiment: { percentage: string },
    ): { percentage: string; sentiment: string; count: number } =>
      parseFloat(sentiment.percentage) > parseFloat(max.percentage)
        ? {
            percentage: sentiment.percentage,
            sentiment: max.sentiment as string,
            count: max.count as number,
          }
        : max,
  );

  return {
    dominant_sentiment: dominantSentiment.sentiment,
    average_score: averageScore.toFixed(2),
    sentiment_distribution: sentimentPercentages,
    overall_confidence: results[0].confidence,
    sentiment_strength: getSentimentStrength(averageScore),
    total_analyzed: totalCount,
  };
}
