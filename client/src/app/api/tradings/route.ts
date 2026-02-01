import { getTradings } from '@/features/trading/queries/get-tradings';
import { searchParamsCache } from '@/features/trading/search-params';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const untypedSearchParams = Object.fromEntries(searchParams);
  const typedSearchParams = searchParamsCache.parse(untypedSearchParams);

  const { list, metadata } = await getTradings(undefined, typedSearchParams);

  return Response.json({ list, metadata });
}
