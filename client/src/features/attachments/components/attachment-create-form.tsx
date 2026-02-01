'use client';

import { FieldError } from '@/components/form/field-error';
import { Form } from '@/components/form/form';
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state';
import { UploadFileInput } from '@/components/upload-file-input';
import { AttachmentEntity } from '@prisma/client';
import { useActionState } from 'react';
import { createAttachments } from '../actions/create-attachments';

type AttachmentCreateFormProps = {
  entityId: string;
  entity: AttachmentEntity;
  buttons?: React.ReactNode;
  onSuccess?: () => void;
};

const AttachmentCreateForm = ({
  entityId,
  entity,
  onSuccess,
}: AttachmentCreateFormProps) => {
  const [actionState, action] = useActionState(
    createAttachments.bind(null, { entityId, entity }),
    EMPTY_ACTION_STATE,
  );

  return (
    <Form action={action} actionState={actionState} onSuccess={onSuccess}>
      <UploadFileInput id="files" name="files" />
      <FieldError actionState={actionState} name="files" />
    </Form>
  );
};

export { AttachmentCreateForm };
