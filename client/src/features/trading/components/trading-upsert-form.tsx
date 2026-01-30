'use client';

import {
  DatePicker,
  ImperativeHandleFromDatePicker,
} from '@/components/date-picker';
import { FieldError } from '@/components/form/field-error';
import { Form } from '@/components/form/form';
import { SubmitButton } from '@/components/form/submit-button';
import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Trading } from '@prisma/client';
import { useActionState, useRef } from 'react';
import { upsertTrading } from '../actions/upsert-trading';

type TradingUpsertFormProps = {
  trading?: Trading;
};

const TradingUpsertForm = ({ trading }: TradingUpsertFormProps) => {
  const [actionState, action] = useActionState(
    upsertTrading.bind(null, trading?.id),
    EMPTY_ACTION_STATE,
  );

  const datePickerImperativeHandleRef =
    useRef<ImperativeHandleFromDatePicker | null>(null);

  const handleSuccess = () => {
    datePickerImperativeHandleRef.current?.reset();
  };

  return (
    <Form action={action} actionState={actionState} onSuccess={handleSuccess}>
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        name="title"
        type="text"
        defaultValue={
          (actionState.payload?.get('title') as string) ?? trading?.title
        }
      />
      <FieldError actionState={actionState} name="title" />

      <Label htmlFor="content">Content</Label>
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
          <Label htmlFor="deadline">Deadline</Label>
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
          <Label htmlFor="buy">buy (원)</Label>
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

      <SubmitButton label={trading ? 'Edit' : 'Create'} />
    </Form>
  );
};

export { TradingUpsertForm };
