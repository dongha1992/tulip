'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { prisma } from '@/lib/prisma';
import { passwordChangeSchema } from '../schema/passwod-change';
import { verifyPasswordHash } from '../utils/hash-and-verify';

export const passwordChange = async (
  _actionState: ActionState,
  formData: FormData,
) => {
  const auth = await getAuthOrRedirect();
  try {
    const { password } = passwordChangeSchema.parse({
      password: formData.get('password'),
    });

    const user = await prisma.user.findUnique({
      where: { email: auth.user.email },
    });
    if (!user) {
      return toActionState('ERROR', '잘못된 요청입니다.', formData);
    }

    const validPassword = await verifyPasswordHash(user.passwordHash, password);

    if (!validPassword) {
      return toActionState('ERROR', '비밀번호가 일치하지 않습니다.', formData);
    }

    // await inngest.send({
    //   name: "app/password.password-reset",
    //   data: {
    //     userId: user.id,
    //   },
    // });
  } catch (error) {
    return fromErrorToActionState(error, formData);
  }
  return toActionState('SUCCESS', '현재 해당 기능은 개발 중입니다.');
  // return toActionState('SUCCESS', '비밀번호가 변경되었습니다.');
};
