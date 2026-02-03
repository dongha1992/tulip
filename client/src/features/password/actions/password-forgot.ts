'use server';

import {
  ActionState,
  fromErrorToActionState,
  toActionState,
} from '@/components/form/utils/to-action-state';
import { prisma } from '@/lib/prisma';
import { passwordForgotSchema } from '../schema/password-forgot';

export const passwordForgot = async (
  _actionState: ActionState,
  formData: FormData,
) => {
  try {
    const { email } = passwordForgotSchema.parse({
      email: formData.get('email'),
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return toActionState('SUCCESS', '메일로 보내기');
    }

    // await inngest.send({
    //   name: 'app/password.password-reset',
    //   data: {
    //     userId: user.id,
    //   },
    // });
  } catch (error) {
    return fromErrorToActionState(error, formData);
  }

  return toActionState('SUCCESS', '메일로 보내기 성공');
};
