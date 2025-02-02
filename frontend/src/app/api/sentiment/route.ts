import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  try {
    const response = await axios.post('http://127.0.0.1:8000/scrape');
    const { feeds: stockFeeds } = response.data;

    const texts = stockFeeds.map((feed) => feed.text).filter(Boolean);

    const sentimentResponse = await axios.post(
      'http://127.0.0.1:8000/analyze',
      {
        texts: texts,
      },
    );

    const koreanResults = sentimentResponse.data.map((result) => ({
      sentiment_score: result.score.toFixed(2),
      positive_percent: result.score.toFixed(2),
      negative_percent: (100 - result.score).toFixed(2),
      detailed_sentiment: result.label,
      confidence: result.confidence,
      overall_sentiment: result.label,
      class_probabilities: result.class_probabilities,
      sentiment_strength: getSentimentStrength(result.score),
    }));

    const sentimentResults = texts.map((text, index) => ({
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

function determineOverallSentiment(results) {
  const sentimentCounts = results.reduce((acc, result) => {
    acc[result.detailed_sentiment] = (acc[result.detailed_sentiment] || 0) + 1;
    return acc;
  }, {});

  const totalCount = results.length;
  const sentimentPercentages = Object.entries(sentimentCounts).map(
    ([sentiment, count]) => ({
      sentiment,
      percentage: ((count / totalCount) * 100).toFixed(2),
      count,
    }),
  );

  const averageScore =
    results.reduce(
      (sum, result) => sum + parseFloat(result.sentiment_score),
      0,
    ) / totalCount;

  const dominantSentiment = sentimentPercentages.reduce((max, sentiment) =>
    parseFloat(sentiment.percentage) > parseFloat(max.percentage)
      ? sentiment
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
