import { Prisma } from "@prisma/client";

export type TradingWithMetadata = Prisma.TradingGetPayload<{
  include: {
    user: {
      select: { username: true };
    };
  };
}> & { isOwner: boolean; permissions: { canDeleteTrading: boolean } };
