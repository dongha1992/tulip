'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LucidePaperclip } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

export const ACCEPTED = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
];

type UploadFileInputProps = {
  id?: string;
  name?: string;
  multiple?: boolean;
  accept?: string;
  className?: string;
  'aria-label'?: string;
};

export type UploadFileInputRef = {
  reset: () => void;
};

const UploadFileInput = forwardRef<UploadFileInputRef, UploadFileInputProps>(
  (
    {
      id = 'files',
      name = 'files',
      multiple = true,
      accept = ACCEPTED.join(','),
      className,
      'aria-label': ariaLabel = '첨부파일 선택',
    },
    ref,
  ) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFileNames([]);
      },
    }));

    return (
      <div className={className ?? 'flex items-center gap-2'}>
        <Input
          ref={fileInputRef}
          id={id}
          name={name}
          type="file"
          multiple={multiple}
          accept={accept}
          className="sr-only"
          aria-label={ariaLabel}
          onChange={(e) => {
            const files = e.target.files;
            setSelectedFileNames(
              files ? Array.from(files).map((f) => f.name) : [],
            );
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          aria-label={ariaLabel}
        >
          <LucidePaperclip className="h-4 w-4" />
        </Button>
        {selectedFileNames.length > 0 && (
          <span className="text-sm text-muted-foreground truncate">
            {selectedFileNames.join(', ')}
          </span>
        )}
      </div>
    );
  },
);

UploadFileInput.displayName = 'UploadFileInput';
export { UploadFileInput };
