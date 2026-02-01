'use client';

import { SubmitButton } from '@/components/form/submit-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AttachmentEntity } from '@prisma/client';
import { PaperclipIcon } from 'lucide-react';
import { useState } from 'react';
import { AttachmentCreateForm } from './attachment-create-form';

type AttachmentCreateButtonProps = {
  entityId: string;
  entity: AttachmentEntity;
  onCreateAttachment?: () => void;
};

const AttachmentCreateButton = ({
  entityId,
  entity,
  onCreateAttachment,
}: AttachmentCreateButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    onCreateAttachment?.();
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="icon">
          <PaperclipIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>파일 업로드</DialogTitle>
          <DialogDescription>
            이미지 또는 PDF 파일을 첨부하세요.
          </DialogDescription>
        </DialogHeader>
        <AttachmentCreateForm
          entityId={entityId}
          entity={entity}
          buttons={
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <SubmitButton label="업로드" />
            </DialogFooter>
          }
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};

export { AttachmentCreateButton };
