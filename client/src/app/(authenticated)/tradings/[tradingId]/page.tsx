type TradingPageProps = {
  params: Promise<{
    tradingId: string;
  }>;
};

const TradingPage = async ({ params }: TradingPageProps) => { 
      const { ticketId } = await params;
        const ticketPromise = getTicket(ticketId);
    // const commentsPromise = getComments(ticketId);
    
      const [ticket, paginatedComments] = await Promise.all([
    ticketPromise,
    // commentsPromise,
  ]);

  if (!ticket) {
    notFound();
  }

    return <div className="flex-1 flex flex-col gap-y-8">
        
        <div className="flex justify-center animate-fade-from-top">

        </div>
    </div>
}

export default TradingPage;
