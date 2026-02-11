import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { forwardRef, type HTMLAttributes } from 'react';

const SectionHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    title: string;
    moreHref: string;
    moreLabel?: string;
    chevronSrc?: string;
  }
>(
  (
    {
      className,
      title,
      moreHref,
      moreLabel = '더보기',
      chevronSrc = '/img/chevron-right.svg',
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <Link
        href={moreHref}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {moreLabel}
        <Image
          src={chevronSrc}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4"
        />
      </Link>
    </div>
  ),
);
SectionHeader.displayName = 'SectionHeader';

export { SectionHeader };
