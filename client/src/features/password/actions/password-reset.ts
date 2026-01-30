import { setCookieByKey } from '@/actions/cookies';
import {
    ActionState,
    fromErrorToActionState,
    toActionState,
} from '@/components/form/utils/to-action-state';
import { prisma } from '@/lib/prisma';
import { signInPath } from '@/paths';
import { hashToken } from '@/utils/crypto';
import { redirect } from 'next/navigation';
import { passwordResetSchema } from '../schema/password-reset';
import { hashPassword } from '../utils/hash-and-verify';

export const passwordReset = async (
  tokenId: string,
  _actionState: ActionState,
  formData: FormData,
) => {
  try {
    const { password } = passwordResetSchema.parse({
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const tokenHash = hashToken(tokenId);
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });

    if (passwordResetToken) {
      await prisma.passwordResetToken.delete({
        where: {
          tokenHash,
        },
      });
    }

    if (
      !passwordResetToken ||
      Date.now() > passwordResetToken.expiresAt.getTime()
    ) {
      return toActionState(
        'ERROR',
        '만료된 또는 유효하지 않은 토큰입니다.',
        formData,
      );
    }

    await prisma.session.deleteMany({
      where: { userId: passwordResetToken.userId },
    });

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: {
        id: passwordResetToken.userId,
      },
      data: {
        passwordHash,
      },
    });
  } catch (error) {
    return fromErrorToActionState(error, formData);
  }
  await setCookieByKey('toast', '비밀번호가 초기화되었습니다.');
  redirect(signInPath());
};
