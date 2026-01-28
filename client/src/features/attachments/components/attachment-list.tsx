'use client';

type Attachment = {
  id: string;
  name: string;
};

type AttachmentListProps = {
  attachments: Attachment[];
  buttons?: (attachmentId: string) => React.ReactNode[];
};

const AttachmentList = ({ attachments, buttons }: AttachmentListProps) => {
  return (
    <div className="flex flex-col gap-y-2">
      {attachments.map((attachment) => (
        <div key={attachment.id} className="flex items-center gap-x-2">
          <span className="text-sm">{attachment.name}</span>
          {buttons && (
            <div className="flex gap-x-1">{buttons(attachment.id)}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export { AttachmentList };

