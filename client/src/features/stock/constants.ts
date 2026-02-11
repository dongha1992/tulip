import type { StockTop5Item } from './types';

export const MOCK_TOP5: StockTop5Item[] = [
  {
    name: '애플',
    symbol: 'AAPL',
    totalOwubu: 1532,
    sentiment: '부정',
    percent: 32,
    badgeVariant: 'destructive',
  },
  {
    name: '엔비디아',
    symbol: 'NVDA',
    totalOwubu: 1532,
    sentiment: '긍정',
    percent: 19,
    badgeVariant: 'positive',
  },
  {
    name: '테슬라',
    symbol: 'TSLA',
    totalOwubu: 1532,
    sentiment: '중립',
    percent: 5,
    badgeVariant: 'neutral',
  },
  {
    name: '엔비디아',
    symbol: 'NVDA',
    totalOwubu: 1532,
    sentiment: '다소부정',
    percent: 19,
    badgeVariant: 'slightly-negative',
  },
  {
    name: '엔비디아',
    symbol: 'NVDA',
    totalOwubu: 1532,
    sentiment: '다소긍정',
    percent: 88,
    badgeVariant: 'slightly-positive',
  },
];

export const COMPANY_ICON_CLASSES: Record<string, string> = {
  AAPL: 'bg-gray-200 text-gray-800',
  NVDA: 'bg-emerald-500/20 text-emerald-700',
  TSLA: 'bg-red-500/20 text-red-700',
};
