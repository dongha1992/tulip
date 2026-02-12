'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { forwardRef, type HTMLAttributes } from 'react';

const StockRankItem = forwardRef<
  HTMLLIElement,
  HTMLAttributes<HTMLLIElement> & {
    title: string;
    description: string;
    badge: React.ReactNode;
    icon?: React.ReactNode;
    iconClassName?: string;
    href?: string;
  }
>(
  (
    {
      className,
      title,
      description,
      badge,
      icon,
      iconClassName,
      href,
      ...props
    },
    ref,
  ) => {
    const leftContent = (
      <div className="flex items-center gap-4">
        {icon ?? (
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
              iconClassName,
            )}
          />
        )}
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    );

    return (
      <li ref={ref} {...props} className="w-[560px]">
        <Card
          className={cn('flex items-center justify-between p-4', className)}
        >
          {href ? (
            <Link
              href={href}
              className="flex flex-1 items-center gap-4 min-w-0 hover:opacity-90 transition-opacity"
            >
              {leftContent}
            </Link>
          ) : (
            leftContent
          )}

          <div className="flex items-center gap-2">{badge}</div>
        </Card>
      </li>
    );
  },
);
StockRankItem.displayName = 'StockRankItem';

export { StockRankItem };
