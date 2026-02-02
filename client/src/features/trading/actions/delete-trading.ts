'use server';

import { setCookieByKey } from '@/actions/cookies';
import {
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import { prisma } from '@/lib/prisma';
import { tradingsPath } from '@/paths';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const deleteTrading = async (id: string) => {
  const { user } = await getAuthOrRedirect();

  try {
    const trading = await prisma.trading.findUnique({
      where: {
        id,
      },
    });

    if (!trading || !isOwner(user, trading)) {
      return toActionState('ERROR', '권한이 없습니다.');
    }

    await prisma.trading.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }

  revalidatePath(tradingsPath());
  await setCookieByKey('toast', '삭제되었습니다.');
  redirect(tradingsPath());
};
