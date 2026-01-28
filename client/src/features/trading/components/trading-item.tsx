'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { tradingEditPath, tradingPath } from '@/paths';
import clsx from 'clsx';
import {
  LucideArrowUpRightFromSquare,
  LucideMoreVertical,
  LucidePencil,
} from 'lucide-react';
import Link from 'next/link';
import { TRADING_ICONS } from '../constants';
import { TradingWithMetadata } from '../types';
import TradingMoreMenu from './trading-more-menu';

type TradingItemProps = {
  trading: TradingWithMetadata;
  isDetail?: boolean;

  attachments?: React.ReactNode;
  referencedTradings?: React.ReactNode;
  comments?: React.ReactNode;
};

const TradingItem = ({
  trading,
  isDetail,
  attachments,
  referencedTradings,
  comments,
}: TradingItemProps) => {
  const detailButton = (
    <Button variant="outline" size="icon" asChild>
      <Link prefetch href={tradingPath(trading.id)}>
        <LucideArrowUpRightFromSquare className="h-4 w-4" />
      </Link>
    </Button>
  );

  const editButton = trading.isOwner ? (
    <Button variant="outline" size="icon" asChild>
      <Link prefetch href={tradingEditPath(trading.id)}>
        <LucidePencil className="h-4 w-4" />
      </Link>
    </Button>
  ) : null;

  const moreMenu = trading.isOwner ? (
    <TradingMoreMenu
      trading={trading}
      trigger={
        <Button variant="outline" size="icon">
          <LucideMoreVertical className="h-4 w-4" />
        </Button>
      }
    />
  ) : null;

  return (
    <div
      className={clsx('w-full flex flex-col gap-y-4', {
        'max-w-[580px]': isDetail,
        'max-w-[420px]': !isDetail,
      })}
    >
      <div className="flex gap-x-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex gap-x-2">
              <span>{TRADING_ICONS[trading.status]}</span>
              <span className="truncate">{trading.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span
              className={clsx('whitespace-break-spaces', {
                'line-clamp-3': !isDetail,
              })}
            >
              {trading.content}
            </span>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              {trading.deadline} by {trading.user.username}
            </p>
          </CardFooter>
        </Card>
        <div className="flex flex-col gap-y-1">
          {isDetail ? (
            <>
              {editButton}
              {moreMenu}
            </>
          ) : (
            <>
              {detailButton}
              {editButton}
            </>
          )}
        </div>
      </div>
      {attachments}
      {referencedTradings}
      {comments}
    </div>
  );
};

export { TradingItem };
