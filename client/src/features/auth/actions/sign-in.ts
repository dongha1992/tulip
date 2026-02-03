'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { verifyPasswordHash } from '@/features/password/utils/hash-and-verify';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { tradingsPath } from '@/paths';
import { generateRandomToken } from '@/utils/crypto';
import { redirect } from 'next/navigation';
import { signInSchema } from '../schema/sign-in';
import { setSessionCookie } from '../utils/session-cookie';

export const signIn = async (_actionState: ActionState, formData: FormData) => {
  try {
    const { email, password } = signInSchema.parse(
      Object.fromEntries(formData),
    );

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const validPassword = await verifyPasswordHash(
      user ? user.passwordHash : '$argon',
      password,
    );

    if (!user || !validPassword) {
      return toActionState(
        'ERROR',
        '잘못된 이메일 또는 비밀번호입니다.',
        formData,
      );
    }

    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, user.id);

    await setSessionCookie(sessionToken, session.expiresAt);
  } catch (error) {
    return fromErrorToActionState(error, formData);
  }
  redirect(tradingsPath());
};
