'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { hashPassword } from '@/features/password/utils/hash-and-verify';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { homePath } from '@/paths';
import { generateRandomToken } from '@/utils/crypto';
import { Prisma } from '@prisma/client';
import { redirect } from 'next/navigation';
import { signUpSchema } from '../schema/sign-up';
import { setSessionCookie } from '../utils/session-cookie';

export const signUp = async (_actionState: ActionState, formData: FormData) => {
  try {
    const { username, email, password } = signUpSchema.parse(
      Object.fromEntries(formData),
    );

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });
    const sessionToken = generateRandomToken();
    const session = await createSession(sessionToken, user.id);

    await setSessionCookie(sessionToken, session.expiresAt);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return toActionState('ERROR', '잘못된 요청입니다.', formData);
    }

    return fromErrorToActionState(error, formData);
  }
  redirect(homePath());
};
