import { z } from 'zod';

const passwordChangeSchema = z.object({
  password: z
    .string()
    .min(6, { message: '비밀번호는 6자 이상이어야 합니다.' })
    .max(191, { message: '비밀번호는 191자 이하여야 합니다.' }),
});

export { passwordChangeSchema };
