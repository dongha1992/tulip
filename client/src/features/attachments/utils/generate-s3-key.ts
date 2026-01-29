import { AttachmentEntity } from '@prisma/client';

type GenerateKeyArgs = {
  entityId: string;
  entity: AttachmentEntity;
  fileName: string;
  attachmentId: string;
};

export const generateS3Key = ({
  entityId,
  entity,
  fileName,
  attachmentId,
}: GenerateKeyArgs) => {
  return `${entity}/${entityId}/${fileName}-${attachmentId}`;
};
