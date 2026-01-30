import { z } from 'zod';

const passwordChangeSchema = z.object({
  password: z.string().min(6).max(191),
});

export { passwordChangeSchema };
