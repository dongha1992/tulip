import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TradingStatus } from "@prisma/client";
import { TRADING_STATUS_LABELS } from "../constants";
import { TradingWithMetadata } from "../types";

type TradingMoreMenuProps = {
  trading: TradingWithMetadata;
  trigger: React.ReactElement;
};

function TradingMoreMenu() {
//   const [deleteButton, deleteDialog] = useConfirmDialog({
//     action: deleteTicket.bind(null, ticket.id),
//     trigger: (
//       <DropdownMenuItem disabled={!ticket.permissions.canDeleteTicket}>
//         <LucideTrash className="h-4 w-4" />
//         <span>Delete</span>
//       </DropdownMenuItem>
//     ),
//   });


  const handleUpdateTicketStatus = async (value: string) => {}

  const tradingStatusRadioGroupItems = (
    <DropdownMenuRadioGroup
      value={trading.status}
      onValueChange={handleUpdateTradingStatus}
    >
      {(Object.keys(TRADING_STATUS_LABELS) as Array<TradingStatus>).map((key) => (
        <DropdownMenuRadioItem key={key} value={key}>
          {TRADING_STATUS_LABELS[key]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  return (
    <>
      {deleteDialog}

      <DropdownMenu>
        <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="right">
          {tradingStatusRadioGroupItems}
          <DropdownMenuSeparator />
          {deleteButton}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default TradingMoreMenu  