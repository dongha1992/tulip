import { PAGE_SIZES } from '@/components/pagination/constants';
import { getAuth } from '@/features/auth/queries/get-auth';
import { isOwner } from '@/features/auth/utils/is-owner';
import { prisma } from '@/lib/prisma';
import { ParsedSearchParams } from '../search-params';

export const getTradings = async (
  userId: string | undefined,
  searchParams: ParsedSearchParams,
) => {
  const { user } = await getAuth();

  if (!PAGE_SIZES.includes(searchParams.size)) {
    throw new Error('잘못된 요청입니다.');
  }

  const where = {
    userId,
    title: {
      contains: searchParams.search,
      mode: 'insensitive' as const,
    },
  };

  const skip = searchParams.size * searchParams.page;
  const take = searchParams.size;

  const [tradings, count] = await prisma.$transaction([
    prisma.trading.findMany({
      where,
      skip,
      take,
      orderBy: {
        [searchParams.sortKey]: searchParams.sortValue,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    }),
    prisma.trading.count({
      where,
    }),
  ]);

  return {
    list: tradings.map((trading) => {
      return {
        ...trading,
        isOwner: isOwner(user, trading),
        permissions: {
          canDeleteTrading: isOwner(user, trading),
        },
      };
    }),
    metadata: {
      count,
      hasNextPage: count > skip + take,
    },
  };
};
