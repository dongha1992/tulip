'use client';

import { Attachment } from '@prisma/client';
import { useOptimistic, useTransition } from 'react';
import { AttachmentDeleteButton } from './attachment-delete-button';
import { AttachmentList } from './attachment-list';

type AttachmentsClientWrapperProps = {
  attachments: Attachment[];
  isOwner: boolean;
};

const AttachmentsClientWrapper = ({
  attachments,
  isOwner,
}: AttachmentsClientWrapperProps) => {
  const [optimisticAttachments, removeOptimistic] = useOptimistic(
    attachments,
    (state, idToRemove: string) => state.filter((a) => a.id !== idToRemove),
  );

  const [_, startTransition] = useTransition();

  return (
    <AttachmentList
      attachments={optimisticAttachments}
      buttons={(attachmentId: string) => [
        ...(isOwner
          ? [
              <AttachmentDeleteButton
                key={attachmentId}
                id={attachmentId}
                onDeleteAttachment={(id) => {
                  startTransition(() => {
                    removeOptimistic(id);
                  });
                }}
              />,
            ]
          : []),
      ]}
    />
  );
};

export { AttachmentsClientWrapper };
