'use server';

import {
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import * as tradingService from '@/features/trading/service';
import { prisma } from '@/lib/prisma';
import { tradingPath } from '@/paths';
import { revalidatePath } from 'next/cache';

export const deleteComment = async (id: string) => {
  const { user } = await getAuthOrRedirect();

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment || !isOwner(user, comment)) {
    return toActionState('ERROR', '잘못된 요청입니다.');
  }

  try {
    await prisma.comment.delete({
      where: { id },
    });

    await tradingService.disconnectReferencedTradingsViaComment(comment);
  } catch (error) {
    return fromErrorToActionState(error);
  }
  revalidatePath(tradingPath(comment.tradingId));

  return toActionState('SUCCESS', '댓글이 삭제됐습니다.');
};
