import { prisma } from '@/lib/prisma';
import { AttachmentEntity } from '@prisma/client';
import * as attachmentSubjectDTO from '../dto/attachment-subject-dto';

export const getAttachmentSubject = async (
  entityId: string,
  entity: AttachmentEntity,
) => {
  switch (entity) {
    case 'TRADING': {
      const trading = await prisma.trading.findUnique({
        where: {
          id: entityId,
        },
      });

      return attachmentSubjectDTO.fromTrading(trading);
    }
    case 'COMMENT': {
      const comment = await prisma.comment.findUnique({
        where: {
          id: entityId,
        },
        include: {
          trading: true,
        },
      });

      return attachmentSubjectDTO.fromComment(comment);
    }
    default:
      return null;
  }
};
