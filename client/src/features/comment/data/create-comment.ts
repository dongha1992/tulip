import { prisma } from '@/lib/prisma';
import { Comment, Prisma } from '@prisma/client';

type UserInclude = { user: { select: { username: true } } };
type TradingInclude = { trading: true };
type UserAndTradingInclude = UserInclude & TradingInclude;

type CreateCommentArgs = {
  userId: string;
  tradingId: string;
  content: string;
};

type IncludeOptions = {
  includeUser?: boolean;
  includeTrading?: boolean;
};

type CommentPayload<T extends IncludeOptions> = T extends {
  includeUser: true;
  includeTrading: true;
}
  ? Prisma.CommentGetPayload<{ include: UserAndTradingInclude }>
  : T extends { includeUser: true }
    ? Prisma.CommentGetPayload<{ include: UserInclude }>
    : T extends { includeTrading: true }
      ? Prisma.CommentGetPayload<{ include: TradingInclude }>
      : Comment;

export async function createComment<T extends IncludeOptions>({
  userId,
  tradingId,
  content,
  options,
}: CreateCommentArgs & { options?: T }): Promise<CommentPayload<T>> {
  const includeUser = options?.includeUser && {
    user: {
      select: {
        username: true,
      },
    },
  };

  const includeTrading = options?.includeTrading && {
    trading: true,
  };

  const comment = await prisma.comment.create({
    data: {
      userId,
      tradingId,
      content,
    },
    include: {
      ...includeUser,
      ...includeTrading,
    },
  });

  return comment as CommentPayload<T>;
}
