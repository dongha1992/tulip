import { getTrading } from '@/features/trading/queries/get-trading';
import { prisma } from '@/lib/prisma';
import { validateSession } from '@/lib/session';
import { tradingsPath } from '@/paths';
import { revalidatePath } from 'next/cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tradingId: string }> },
) {
  const { tradingId } = await params;
  const trading = await getTrading(tradingId);

  return Response.json(trading);
}

export async function DELETE(
  { headers }: Request,
  { params }: { params: Promise<{ tradingId: string }> },
) {
  const { tradingId } = await params;

  const bearerToken = new Headers(headers).get('Authorization');
  const authToken = (bearerToken || '').split('Bearer ').at(1);

  if (!authToken) {
    return Response.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const { user } = await validateSession(authToken);

  if (!user) {
    return Response.json({ error: '권한이 없습니다.' }, { status: 401 });
  }

  const trading = await prisma.trading.findUnique({
    where: {
      id: tradingId,
    },
  });

  if (!trading) {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 404 });
  }

  if (trading.userId !== user.id) {
    return Response.json({ error: '권한이 없습니다.' }, { status: 403 });
  }

  await prisma.trading.delete({
    where: {
      id: tradingId,
    },
  });

  revalidatePath(tradingsPath());

  return Response.json({ tradingId });
}
