import { attachmentDownloadPath } from '@/paths';
import { Attachment } from '@prisma/client';
import { LucideArrowUpRightFromSquare } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AttachmentItemProps = {
  attachment: Attachment;
  buttons: ReactNode[];
};

const AttachmentItem = ({ attachment, buttons }: AttachmentItemProps) => {
  return (
    <div className="flex justify-between items-center">
      <Link
        className="flex gap-x-2 items-center text-sm truncate"
        href={attachmentDownloadPath(attachment.id)}
      >
        <LucideArrowUpRightFromSquare className="h-4 w-4" />
        {attachment.name}
      </Link>
      {buttons}
    </div>
  );
};

export { AttachmentItem };
