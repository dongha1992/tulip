import { CardCompact } from '@/components/card-compact';
import { AttachmentEntity } from '@prisma/client';
import { getAttachments } from '../queries/get-attachments';
import { AttachmentCreateForm } from './attachment-create-form';
import { AttachmentsClientWrapper } from './attachments-client-wrapper';

type AttachmentsProps = {
  entityId: string;
  entity: AttachmentEntity;
  isOwner: boolean;
  isDetail?: boolean;
};

const Attachments = async ({
  entityId,
  entity,
  isOwner,
  isDetail,
}: AttachmentsProps) => {
  const attachments = await getAttachments(entityId, entity);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <CardCompact
      title=""
      description=""
      content={
        <>
          <AttachmentsClientWrapper
            attachments={attachments}
            isOwner={isOwner}
          />
          {isOwner && !isDetail && (
            <AttachmentCreateForm entityId={entityId} entity={entity} />
          )}
        </>
      }
    />
  );
};

export { Attachments };
