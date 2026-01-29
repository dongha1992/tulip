import { prisma } from '@/lib/prisma';
import { AttachmentEntity } from '@prisma/client';

export const getAttachments = async (
  entityId: string,
  entity: AttachmentEntity,
) => {
  switch (entity) {
    case 'TRADING': {
      return await prisma.attachment.findMany({
        where: {
          tradingId: entityId,
        },
      });
    }
    case 'COMMENT': {
      return await prisma.attachment.findMany({
        where: {
          commentId: entityId,
        },
      });
    }
    default:
      return [];
  }
};
