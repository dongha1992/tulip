'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { forwardRef, useCallback, type HTMLAttributes } from 'react';
import { Button } from './ui/button';

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
    const handleAnalyze = useCallback(async (stockId: string) => {
      // // 클라이언트 기준: 회원당 하루 한 번만 실행 (user.id 기준으로 기록)
      // if (typeof window !== 'undefined') {
      //   const key = `lastAnalyzeAt:${user.id}`;
      //   const last = window.localStorage.getItem(key);
      //   if (last) {
      //     const lastDate = new Date(last);
      //     const now = new Date();
      //     const diffMs = now.getTime() - lastDate.getTime();
      //     const oneDayMs = 24 * 60 * 60 * 1000;

      //     if (diffMs < oneDayMs) {
      //       alert('감정 분석은 회원당 하루에 한 번만 이용할 수 있습니다.');
      //       return;
      //     }
      //   }
      // }

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock_id: stockId }),
        });
        const data = await res.json();
        console.log(data);

        // if (typeof window !== 'undefined') {
        //   const key = `lastAnalyzeAt:${user.id}`;
        //   window.localStorage.setItem(key, new Date().toISOString());
        // }
      } catch (e) {
        console.error(e);
      }
    }, []);

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
      <li ref={ref} {...props}>
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

          <div className="flex items-center gap-2">
            {badge}
            <Button onClick={() => handleAnalyze('AMX0240604001')}>
              {true ? '분석 중...' : '감정 분석'}
            </Button>
          </div>
        </Card>
      </li>
    );
  },
);
StockRankItem.displayName = 'StockRankItem';

export { StockRankItem };
