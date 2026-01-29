import { prisma } from '@/lib/prisma';

export const getReferencedTradings = async (tradingId: string) => {
  const trading = await prisma.trading.findUnique({
    where: { id: tradingId },
    include: {
      referencedTradings: true,
    },
  });

  return trading?.referencedTradings ?? [];
};
