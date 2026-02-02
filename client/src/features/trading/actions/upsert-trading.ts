'use server';

import { setCookieByKey } from '@/actions/cookies';
import {
  ActionState,
  EMPTY_ACTION_STATE,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { createAttachments } from '@/features/attachments/actions/create-attachments';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import { prisma } from '@/lib/prisma';
import { tradingPath, tradingsPath } from '@/paths';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const upsertTradingSchema = z.object({
  title: z.string().min(1).max(191, { message: '제목 길이가 너무 깁니다.' }),
  content: z.string().min(1).max(1024, { message: '내용 길이가 너무 깁니다.' }),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: '날짜 형식이 올바르지 않습니다.',
  }),
  buy: z.coerce.number().positive({ message: '구매 가격은 양수여야 합니다.' }),
});

export const upsertTrading = async (
  id: string | undefined,
  _actionState: ActionState,
  formData: FormData,
) => {
  const { user } = await getAuthOrRedirect();
  let createdId: string | null = null;
  try {
    if (id) {
      const trading = await prisma.trading.findUnique({
        where: {
          id,
        },
      });

      if (!trading || !isOwner(user, trading)) {
        return toActionState('ERROR', '권한이 없습니다.');
      }
    }

    const data = upsertTradingSchema.parse({
      title: formData.get('title'),
      content: formData.get('content'),
      deadline: formData.get('deadline'),
      buy: formData.get('buy'),
    });

    const dbData = {
      ...data,
      userId: user.id,
    };

    const result = await prisma.trading.upsert({
      where: { id: id || '' },
      update: dbData,
      create: { ...dbData },
    });

    if (!id) {
      createdId = result.id;
    }

    if (id) {
      const deletedIds = formData.getAll('deletedAttachmentIds') as string[];
      if (deletedIds.length > 0) {
        await prisma.attachment.deleteMany({
          where: {
            id: { in: deletedIds },
            tradingId: id,
          },
        });
      }
    }

    if (formData.getAll('files').length > 0) {
      await createAttachments(
        { entityId: result.id, entity: 'TRADING' },
        EMPTY_ACTION_STATE,
        formData,
      );
    }
  } catch (error) {
    return fromErrorToActionState(error, formData);
  }

  revalidatePath(tradingsPath());

  if (!createdId) throw new Error('ID가 없습니다.');

  if (id) {
    await setCookieByKey('toast', '수정되었습니다.');
    redirect(tradingPath(id));
  }

  await setCookieByKey('toast', '생성되었습니다.');
  redirect(tradingPath(createdId));
};
