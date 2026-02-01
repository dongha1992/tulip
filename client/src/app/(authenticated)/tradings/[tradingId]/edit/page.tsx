import { Breadcrumbs } from '@/components/breadcrumbs';
import { CardCompact } from '@/components/card-compact';
import { Separator } from '@/components/ui/separator';
import { getAttachments } from '@/features/attachments/queries/get-attachments';
import { TradingUpsertForm } from '@/features/trading/components/trading-upsert-form';
import { getTrading } from '@/features/trading/queries/get-trading';
import { homePath, tradingPath } from '@/paths';
import { notFound } from 'next/navigation';

type TradingEditPageProps = {
  params: Promise<{
    tradingId: string;
  }>;
};

const TradingEditPage = async ({ params }: TradingEditPageProps) => {
  const { tradingId } = await params;
  const [trading, attachments] = await Promise.all([
    getTrading(tradingId),
    getAttachments(tradingId, 'TRADING'),
  ]);

  if (!trading || !trading.isOwner) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Breadcrumbs
        breadcrumbs={[
          { title: 'Tradings', href: homePath() },
          { title: trading.title, href: tradingPath(trading.id) },
          { title: 'Edit' },
        ]}
      />

      <Separator />

      <div className="flex-1 flex flex-col justify-center items-center">
        <CardCompact
          title="Edit Trading"
          description="Edit an existing trading"
          className="w-full max-w-[420px] animate-fade-from-top"
          content={
            <TradingUpsertForm trading={trading} attachments={attachments} />
          }
        />
      </div>
    </div>
  );
};

export default TradingEditPage;
