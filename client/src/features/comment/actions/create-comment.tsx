'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import * as attachmentSubjectDTO from '@/features/attachments/dto/attachment-subject-dto';
import { filesSchema } from '@/features/attachments/schema/files';
import * as attachmentService from '@/features/attachments/service';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import * as tradingData from '@/features/trading/data';
import { tradingPath } from '@/paths';
import { findIdsFromText } from '@/utils/find-ids-from-text';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as commentData from '../data';

const createCommentSchema = z.object({
  content: z.string().min(1).max(1024),
  files: filesSchema,
});

export const createComment = async (
  tradingId: string,
  _actionState: ActionState,
  formData: FormData,
) => {
  const { user } = await getAuthOrRedirect();
  let comment;

  try {
    const { content, files } = createCommentSchema.parse({
      content: formData.get('content'),
      files: formData.getAll('files'),
    });

    comment = await commentData.createComment({
      userId: user.id,
      tradingId,
      content,
      options: {
        includeUser: true,
        includeTrading: true,
      },
    });

    const subject = attachmentSubjectDTO.fromComment(comment);

    if (!subject) {
      return toActionState('ERROR', '댓글 생성에 실패했습니다.');
    }

    await attachmentService.createAttachments({
      subject: subject,
      entity: 'COMMENT',
      entityId: comment.id,
      files,
    });

    await tradingData.connectReferencedTradings(
      tradingId,
      findIdsFromText('tradings', content),
    );
  } catch (error) {
    return fromErrorToActionState(error);
  }

  revalidatePath(tradingPath(tradingId));
  return toActionState('SUCCESS', '댓글이 생성되었습니다.', undefined, {
    ...comment,
    isOwner: true,
  });
};
