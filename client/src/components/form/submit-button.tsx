'use client';

import { LucideLoaderCircle } from 'lucide-react';
import { cloneElement } from 'react';
import { useFormStatus } from 'react-dom';
import { Button, ButtonProps } from '../ui/button';

type SubmitButtonProps = {
  className?: string;
  label?: string;
  icon?: React.ReactElement;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  form?: string;
};

const SubmitButton = ({
  className,
  label,
  icon,
  variant = 'default',
  size = 'default',
  form,
}: SubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button
      disabled={pending}
      type="submit"
      variant={variant}
      size={size}
      form={form}
      className={className}
    >
      {pending ? (
        <LucideLoaderCircle className="h-4 w-4 animate-spin" />
      ) : icon ? (
        cloneElement(icon as React.ReactElement<{ className?: string }>, {
          className: 'w-4 h-4',
        })
      ) : null}
      {label}
    </Button>
  );
};

export { SubmitButton };
