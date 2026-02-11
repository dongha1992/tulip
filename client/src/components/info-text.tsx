import { cn } from '@/lib/utils';
import Image from 'next/image';
import { forwardRef, type HTMLAttributes } from 'react';

const InfoText = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { iconSrc?: string }
>(({ className, children, iconSrc = '/img/info.svg', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center gap-2 text-sm text-muted-foreground',
      className,
    )}
    {...props}
  >
    <span>{children}</span>
    <Image
      src={iconSrc}
      alt="정보"
      width={16}
      height={16}
      className="h-4 w-4 shrink-0 opacity-70"
    />
  </div>
));
InfoText.displayName = 'InfoText';

export { InfoText };
