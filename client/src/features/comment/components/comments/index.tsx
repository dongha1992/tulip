'use client';

import { CardCompact } from '@/components/card-compact';
import { PaginatedData } from '@/components/pagination/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { CommentWithMetadata } from '../../types';
import { CommentCreateForm } from '../comment-create-form';
import { CommentList } from '../comment-list';
import { usePaginatedComments } from './use-paginated-comments';

type CommentsProps = {
  tradingId: string;
  paginatedComments: PaginatedData<CommentWithMetadata>;
};

const Comments = ({ tradingId, paginatedComments }: CommentsProps) => {
  const {
    comments,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    onCreateComment,
    onDeleteComment,
    onDeleteAttachment,
  } = usePaginatedComments(tradingId, paginatedComments);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);
  return (
    <>
      <CardCompact
        title="댓글 작성"
        description="댓글을 작성해주세요."
        content={
          <CommentCreateForm
            tradingId={tradingId}
            onCreateComment={onCreateComment}
          />
        }
      />
      <div className="flex flex-col gap-y-2 ml-8">
        <CommentList
          comments={comments}
          onDeleteComment={onDeleteComment}
          onDeleteAttachment={onDeleteAttachment}
        />

        {isFetchingNextPage && (
          <>
            <div className="flex gap-x-2">
              <Skeleton className="h-[82px] w-full" />
              <Skeleton className="h-[40px] w-[40px]" />
            </div>
            <div className="flex gap-x-2">
              <Skeleton className="h-[82px] w-full" />
              <Skeleton className="h-[40px] w-[40px]" />
            </div>
          </>
        )}
      </div>
      <div ref={ref}>
        {!hasNextPage && (
          <p className="text-right text-xs italic">No more comments.</p>
        )}
      </div>
    </>
  );
};

export { Comments };
