import { prisma } from '@/lib/prisma';

export const connectReferencedTradings = async (
  tradingId: string,
  tradingIds: string[],
) => {
  await prisma.trading.update({
    where: {
      id: tradingId,
    },
    data: {
      referencedTradings: {
        connect: tradingIds.map((id) => ({
          id,
        })),
      },
    },
  });
};
