import { prisma } from '@/lib/prisma';
import type { AttachmentEntity } from '@prisma/client';

type CreateAttachmentArgs = {
  name: string;
  entity: AttachmentEntity;
  entityId: string;
};

export const createAttachment = async ({
  name,
  entity,
  entityId,
}: CreateAttachmentArgs) => {
  return await prisma.attachment.create({
    data: {
      name,
      ...(entity === 'TRADING' ? { tradingId: entityId } : {}),
      ...(entity === 'COMMENT' ? { commentId: entityId } : {}),
      entity,
    },
  });
};
