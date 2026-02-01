'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import { tradingPath } from '@/paths';
import type { AttachmentEntity } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { filesSchema } from '../schema/files';
import * as attachmentService from '../service';

const createAttachmentsSchema = z.object({
  files: filesSchema.refine(
    (files) => files.length !== 0,
    '파일이 필요합니다.',
  ),
});

type CreateAttachmentsArgs = {
  entityId: string;
  entity: AttachmentEntity;
};

export const createAttachments = async (
  { entityId, entity }: CreateAttachmentsArgs,
  _actionState: ActionState,
  formData: FormData,
) => {
  const { user } = await getAuthOrRedirect();

  const subject = await attachmentService.getAttachmentSubject(
    entityId,
    entity,
  );

  if (!subject) {
    return toActionState('ERROR', '정보를 찾을 수 없습니다.');
  }

  if (!isOwner(user, subject)) {
    return toActionState('ERROR', '잘못된 접근입니다.');
  }

  try {
    const { files } = createAttachmentsSchema.parse({
      files: formData.getAll('files'),
    });

    await attachmentService.createAttachments({
      subject,
      entity,
      entityId,
      files,
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }

  revalidatePath(tradingPath(subject.tradingId));

  return toActionState('SUCCESS', '첨부파일 업로드 완료');
};
