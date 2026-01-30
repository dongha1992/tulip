import { z } from 'zod';

const signInSchema = z.object({
  email: z
    .string()
    .min(1, { message: '이메일은 필수입니다.' })
    .max(191)
    .email({ message: '이메일 형식이 올바르지 않습니다.' }),
  password: z
    .string()
    .min(6, { message: '비밀번호는 6자 이상이어야 합니다.' })
    .max(191),
});

export { signInSchema };
