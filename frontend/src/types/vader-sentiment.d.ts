declare module 'vader-sentiment' {
  export interface SentimentScores {
    neg: number;
    neu: number;
    pos: number;
    compound: number;
  }

  export const SentimentIntensityAnalyzer: {
    polarity_scores(text: string): SentimentScores;
  };
}
