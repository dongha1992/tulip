import { prisma } from '@/lib/prisma';
import { findIdsFromText } from '@/utils/find-ids-from-text';
import { Comment } from '@prisma/client';

export const disconnectReferencedTradingsViaComment = async (
  comment: Comment,
) => {
  const tradingId = comment.tradingId;
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

  const allOtherContent = comments.map((comment) => comment.content).join(' ');
  const allOtherTradingIds = findIdsFromText('tradings', allOtherContent);

  const tradingIdsToRemove = tradingIds.filter(
    (tradingId) => !allOtherTradingIds.includes(tradingId),
  );

  await prisma.trading.update({
    where: {
      id: tradingId,
    },
    data: {
      referencedTradings: {
        disconnect: tradingIdsToRemove.map((id) => ({
          id,
        })),
      },
    },
  });
};
