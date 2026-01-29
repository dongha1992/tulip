import { AttachmentEntity } from '@prisma/client';
import { AttachmentSubject, isComment, isTrading } from '../types';

export type Type = {
  entityId: string;
  entity: AttachmentEntity;
  userId: string | null;
  tradingId: string;
  commentId: string | null;
};

export const fromTrading = (trading: AttachmentSubject | null) => {
  if (!trading || !isTrading(trading)) {
    return null;
  }

  return {
    entity: 'Trading' as AttachmentEntity,
    entityId: trading.id,
    userId: trading.userId,
    tradingId: trading.id,
    commentId: null,
  };
};

export const fromComment = (comment: AttachmentSubject | null) => {
  if (!comment || !isComment(comment)) {
    return null;
  }

  return {
    entity: 'COMMENT' as AttachmentEntity,
    entityId: comment.id,
    userId: comment.userId,
    tradingId: comment.trading.id,
    commentId: comment.id,
  };
};
