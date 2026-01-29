// Prisma 없이 정의 (클라이언트 번들에서 사용 가능)
export type TradingStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export type TradingWithMetadata = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  content: string;
  status: TradingStatus;
  deadline: string;
  buy: number;
  userId: string;
  user: { username: string };
  isOwner: boolean;
  permissions: { canDeleteTrading: boolean };
};

/** 폼 수정 시 전달되는 트레이딩 (서버에서 내려주는 편집용 payload) */
export type TradingForUpsert = Pick<
  TradingWithMetadata,
  'id' | 'title' | 'content' | 'deadline' | 'buy'
>;
