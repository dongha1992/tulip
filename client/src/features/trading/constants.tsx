import { LucideCheckCircle, LucideFileText, LucidePencil } from 'lucide-react';

export const TRADING_ICONS = {
  OPEN: <LucideFileText />,
  DONE: <LucideCheckCircle />,
  IN_PROGRESS: <LucidePencil />,
};

export const TRADING_STATUS_LABELS = {
  OPEN: '시작',
  DONE: '완료',
  IN_PROGRESS: '진행중',
};
