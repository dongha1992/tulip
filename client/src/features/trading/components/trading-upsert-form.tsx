'use client';

import {
  DatePicker,
  ImperativeHandleFromDatePicker,
} from '@/components/date-picker';
import { FieldError } from '@/components/form/field-error';
import { Form } from '@/components/form/form';
import { SubmitButton } from '@/components/form/submit-button';
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  UploadFileInput,
  type UploadFileInputRef,
} from '@/components/upload-file-input';
import { AttachmentList } from '@/features/attachments/components/attachment-list';
import type { Attachment, Trading } from '@prisma/client';
import { LucideTrash } from 'lucide-react';
import { useActionState, useEffect, useRef, useState } from 'react';
import { upsertTrading } from '../actions/upsert-trading';

type TradingUpsertFormProps = {
  trading?: Trading;
  attachments?: Attachment[];
};

const TradingUpsertForm = ({
  trading,
  attachments = [],
}: TradingUpsertFormProps) => {
  const fileInputRef = useRef<UploadFileInputRef>(null);
  const [actionState, action, isPending] = useActionState(
    upsertTrading.bind(null, trading?.id),
    EMPTY_ACTION_STATE,
  );

  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState<string[]>(
    [],
  );
  const visibleAttachments = attachments.filter(
    (a) => !attachmentIdsToDelete.includes(a.id),
  );

  const datePickerImperativeHandleRef =
    useRef<ImperativeHandleFromDatePicker | null>(null);

  const handleSuccess = () => {
    datePickerImperativeHandleRef.current?.reset();
  };

  useEffect(() => {
    if (actionState.status === 'ERROR') {
      fileInputRef.current?.reset();
    }
  }, [actionState.status]);

  return (
    <>
      <Form
        id="trading-form"
        action={action}
        actionState={actionState}
        onSuccess={handleSuccess}
      >
        <Label htmlFor="title">종목</Label>
        <Input
          id="title"
          name="title"
          type="text"
          defaultValue={
            (actionState.payload?.get('title') as string) ?? trading?.title
          }
        />
        <FieldError actionState={actionState} name="title" />

        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={
            (actionState.payload?.get('content') as string) ?? trading?.content
          }
        />
        <FieldError actionState={actionState} name="content" />

        <div className="flex gap-x-2 mb-1">
          <div className="w-1/2">
            <Label htmlFor="deadline">매수 시점</Label>
            <DatePicker
              id="deadline"
              name="deadline"
              defaultValue={
                (actionState.payload?.get('deadline') as string) ??
                trading?.deadline
              }
              imperativeHandleRef={datePickerImperativeHandleRef}
            />
            <FieldError actionState={actionState} name="deadline" />
          </div>
          <div className="w-1/2">
            <Label htmlFor="buy">평균 매수 가격($)</Label>
            <Input
              id="buy"
              name="buy"
              type="number"
              step="1"
              defaultValue={
                (actionState.payload?.get('buy') as string) ?? trading?.buy
              }
            />
            <FieldError actionState={actionState} name="buy" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="files">첨부파일</Label>
          {trading?.id && attachments.length > 0 && (
            <AttachmentList
              attachments={visibleAttachments}
              buttons={(attachmentId) => [
                <Button
                  key={attachmentId}
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    setAttachmentIdsToDelete((prev) => [...prev, attachmentId])
                  }
                >
                  <LucideTrash className="h-4 w-4" />
                </Button>,
              ]}
            />
          )}
          {attachmentIdsToDelete.map((id) => (
            <input
              key={id}
              type="hidden"
              name="deletedAttachmentIds"
              value={id}
            />
          ))}
          <UploadFileInput ref={fileInputRef} id="files" name="files" />
        </div>
      </Form>
      <SubmitButton
        className="w-full max-w-[420px] mt-2"
        form="trading-form"
        label={trading ? '수정하기' : '만들기'}
        pending={isPending}
      />
    </>
  );
};

export { TradingUpsertForm };
