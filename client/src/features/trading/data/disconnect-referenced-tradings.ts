import { prisma } from '@/lib/prisma';

export const disconnectReferencedTradings = async (
  tradingId: string,
  tradingIds: string[],
) => {
  await prisma.trading.update({
    where: {
      id: tradingId,
    },
    data: {
      referencedTradings: {
        disconnect: tradingIds.map((id) => ({
          id,
        })),
      },
    },
  });
};
