'use client';

import { FieldError } from '@/components/form/field-error';
import { Form } from '@/components/form/form';
import { SubmitButton } from '@/components/form/submit-button';
import {
  ActionState,
  EMPTY_ACTION_STATE,
} from '@/components/form/utils/to-action-state';
import { Textarea } from '@/components/ui/textarea';
import {
  UploadFileInput,
  UploadFileInputRef,
} from '@/components/upload-file-input';
import { useActionState, useRef } from 'react';
import { createComment } from '../actions/create-comment';
import { CommentWithMetadata } from '../types';

type CommentCreateFormProps = {
  tradingId: string;
  onCreateComment?: (comment: CommentWithMetadata | undefined) => void;
};

const CommentCreateForm = ({
  tradingId,
  onCreateComment,
}: CommentCreateFormProps) => {
  const [actionState, action] = useActionState(
    createComment.bind(null, tradingId),
    EMPTY_ACTION_STATE,
  );
  const uploadFileInputRef = useRef<UploadFileInputRef>(null);

  const handleSuccess = (actionState: ActionState) => {
    uploadFileInputRef.current?.reset();
    onCreateComment?.(actionState.data as CommentWithMetadata | undefined);
  };

  return (
    <Form action={action} actionState={actionState} onSuccess={handleSuccess}>
      <Textarea name="content" placeholder="댓글을 입력해주세요." />
      <FieldError actionState={actionState} name="content" />

      <UploadFileInput ref={uploadFileInputRef} id="files" name="files" />
      <FieldError actionState={actionState} name="files" />
      <SubmitButton label="작성하기" />
    </Form>
  );
};

export { CommentCreateForm };
