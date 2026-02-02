'use server';

import {
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { isOwner } from '@/features/auth/utils/is-owner';
import { prisma } from '@/lib/prisma';
import * as attachmentData from '../data';
import * as attachmentSubjectDTO from '../dto/attachment-subject-dto';

export const deleteAttachment = async (id: string) => {
  const { user } = await getAuthOrRedirect();
  console.log(id, 'deleteAttachment id');
  const attachment = await attachmentData.getAttachment(id);
  console.log(attachment, '--');
  let subject;
  switch (attachment?.entity) {
    case 'TRADING':
      subject = attachmentSubjectDTO.fromTrading(attachment.trading);
      break;
    case 'COMMENT':
      subject = attachmentSubjectDTO.fromComment(attachment.comment);
      break;
  }

  if (!subject || !attachment) {
    return toActionState('ERROR', '정보를 찾을 수 없습니다.');
  }

  if (!isOwner(user, subject)) {
    return toActionState('ERROR', '잘못된 접근입니다.');
  }

  try {
    await prisma.attachment.delete({
      where: {
        id,
      },
    });
  } catch (error) {
    return fromErrorToActionState(error);
  }

  return toActionState('SUCCESS', '첨부파일 삭제 완료');
};
