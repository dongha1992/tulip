import { Prisma } from '@prisma/client';

type AttachmentSubjectTrading = Prisma.TradingGetPayload<{
  select: {
    id: true;
    userId: true;
  };
}>;

type AttachmentSubjectComment = Prisma.CommentGetPayload<{
  include: {
    trading: {
      select: {
        id: true;
      };
    };
  };
}>;

export type AttachmentSubject =
  | AttachmentSubjectTrading
  | AttachmentSubjectComment;

export const isTrading = (
  subject: AttachmentSubject,
): subject is AttachmentSubjectTrading => {
  return !('trading' in subject);
};

export const isComment = (
  subject: AttachmentSubject,
): subject is AttachmentSubjectComment => {
  return 'trading' in subject;
};
