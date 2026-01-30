import { z } from 'zod';

const passwordForgotSchema = z.object({
  email: z
    .string()
    .min(1, { message: '이메일을 입력해주세요.' })
    .max(191)
    .email(),
});
export { passwordForgotSchema };
