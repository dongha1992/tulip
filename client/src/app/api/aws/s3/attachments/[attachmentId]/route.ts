import * as attachmentData from '@/features/attachments/data';
import * as attachmentSubjectDTO from '@/features/attachments/dto/attachment-subject-dto';
import { generateS3Key } from '@/features/attachments/utils/generate-s3-key';
import { getAuthOrRedirect } from '@/features/auth/queries/get-auth-or-redirect';
import { s3 } from '@/lib/aws';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  await getAuthOrRedirect();

  try {
    const { attachmentId } = await params;

    const attachment = await attachmentData.getAttachment(attachmentId);

    if (!attachment) {
      throw new Error('Attachment를 찾을 수 없습니다.');
    }

    let subject;
    switch (attachment?.entity) {
      case 'TRADING':
        subject = attachmentSubjectDTO.fromTrading(attachment.trading);
        break;
      case 'COMMENT':
        subject = attachmentSubjectDTO.fromComment(attachment.comment);
        break;
    }

    if (!subject || !attachment) {
      throw new Error('찾을 수 없는 첨부파일입니다.');
    }

    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: generateS3Key({
          entityId: subject.entityId,
          entity: attachment.entity,
          fileName: attachment.name,
          attachmentId: attachment.id,
        }),
      }),
      { expiresIn: 5 * 60 },
    );

    const response = await fetch(presignedUrl);

    const headers = new Headers();

    headers.append(
      'content-disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
    );

    return new Response(response.body, {
      headers,
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
