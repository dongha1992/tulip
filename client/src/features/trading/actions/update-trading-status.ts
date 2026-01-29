'use server';

import {
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import { prisma } from '@/lib/prisma';
import { tradingsPath } from '@/paths';
import { TradingStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export const updateTradingStatus = async (
  id: string,
  status: TradingStatus,
) => {
  const { user } = await getAuthOrRedirect();

  try {
    const trading = await prisma.trading.findUnique({
      where: {
        id,
      },
    });

    if (!trading || !isOwner(user, trading)) {
      return toActionState('ERROR', '잘못된 요청입니다.');
    }

    await prisma.trading.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }

  revalidatePath(tradingsPath());

  return toActionState('SUCCESS', '상태가 업데이트 됐습니다.');
};
