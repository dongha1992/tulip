import { prisma } from '@/lib/prisma';
import { findIdsFromText } from '@/utils/find-ids-from-text';
import { Comment } from '@prisma/client';
import * as tradingData from '../data';

export const disconnectReferencedTradingsViaComment = async (
  commentIdOrComment: Comment | string,
) => {
  const comment =
    typeof commentIdOrComment === 'string'
      ? await prisma.comment.findUnique({
          where: {
            id: commentIdOrComment,
          },
        })
      : commentIdOrComment;

  if (!comment) {
    throw new Error('댓글을 찾지 못 했습니다.');
  }

  const tradingIds = findIdsFromText('tradings', comment.content);

  if (!tradingIds.length) return;

  const comments = await prisma.comment.findMany({
    where: {
      tradingId: comment.tradingId,
      id: {
        not: comment.id,
      },
    },
  });

  const allOtherTradingIds = findIdsFromText(
    'tradings',
    comments.map((comment) => comment.content).join(' '),
  );

  const tradingIdsToRemove = tradingIds.filter(
    (tradingId) => !allOtherTradingIds.includes(tradingId),
  );

  await tradingData.disconnectReferencedTradings(
    comment.tradingId,
    tradingIdsToRemove,
  );
};
