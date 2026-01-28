import { Breadcrumbs } from '@/components/breadcrumbs';
import { Separator } from '@/components/ui/separator';
import { Attachments } from '@/features/attachments/components';
import { Comments } from '@/features/comment/components/comments';
import { getComments } from '@/features/comment/queries/get-comments';
import { TradingItem } from '@/features/trading/components/trading-item';
import { getTrading } from '@/features/trading/queries/get-trading';
import { homePath } from '@/paths';
import { notFound } from 'next/navigation';

type TradingPageProps = {
  params: Promise<{
    tradingId: string;
  }>;
};

const TradingPage = async ({ params }: TradingPageProps) => {
  const { tradingId } = await params;
  const tradingPromise = getTrading(tradingId);
  const commentsPromise = getComments(tradingId);

  const [trading, paginatedComments] = await Promise.all([
    tradingPromise,
    commentsPromise,
  ]);

  if (!trading) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: '홈', href: homePath() },
          { title: trading.title },
        ]}
      />
      <Separator />
      <div className="flex justify-center animate-fade-from-top">
        <TradingItem
          trading={trading}
          isDetail
          attachments={
            <Attachments
              entityId={trading.id}
              entity="Trading"
              isOwner={trading.isOwner}
            />
          }
          // referencedTradings={<ReferencedTradings tradingId={trading.id} />}
          comments={
            <Comments
              tradingId={trading.id}
              paginatedComments={paginatedComments}
            />
          }
        />
      </div>
    </div>
  );
};

export default TradingPage;
