import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import axios from 'axios';

let model = null;

export async function GET(req: NextRequest) {
  try {
    // Python API 호출
    const response = await axios.post('http://127.0.0.1:8000/scrape');
    const { feeds: stockFeeds } = response.data;

    console.log(stockFeeds, 'stockFeeds');
    // 감정 분석 수행
    const texts = stockFeeds.map((feed) => feed.text).filter(Boolean);
    const koreanResults = await Promise.all(texts.map(analyzeKoreanSentiment));

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

async function analyzeKoreanSentiment(text) {
  if (!model) {
    model = await pipeline(
      'sentiment-analysis',
      'Xenova/bert-base-multilingual-uncased-sentiment',
    );
  }

  try {
    const result = await model(text);
    const score = result[0].score;
    const label = result[0].label;

    return {
      sentiment_score: score.toFixed(4),
      positive_percent: (score * 100).toFixed(2),
      negative_percent: ((1 - score) * 100).toFixed(2),
      detailed_sentiment: getDetailedSentiment(score),
      confidence: getConfidenceLevel(score),
      overall_sentiment: interpretLabel(label),
    };
  } catch (e) {
    console.error(`Error in analyzeKoreanSentiment: ${e.message}`);
    return {
      sentiment_score: '0.5000',
      positive_percent: '50.00',
      negative_percent: '50.00',
      detailed_sentiment: '중립',
      confidence: '낮음',
      overall_sentiment: '중립',
    };
  }
}

function getDetailedSentiment(score) {
  if (score < 0.2) return '매우 부정';
  if (score < 0.4) return '다소 부정';
  if (score < 0.6) return '중립';
  if (score < 0.8) return '다소 긍정';
  return '매우 긍정';
}

function getConfidenceLevel(score) {
  const confidence = Math.abs(score - 0.5) * 2;
  if (confidence < 0.33) return '낮음';
  if (confidence < 0.66) return '중간';
  return '높음';
}

function interpretLabel(label) {
  const labelMap = {
    '1 star': '매우 부정',
    '2 stars': '부정',
    '3 stars': '중립',
    '4 stars': '긍정',
    '5 stars': '매우 긍정',
  };
  return labelMap[label] || '중립';
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
    average_score: averageScore.toFixed(4),
    sentiment_distribution: sentimentPercentages,
    overall_confidence: getConfidenceLevel(averageScore),
  };
}
