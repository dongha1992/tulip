'use client';

import { useConfirmDialog } from '@/components/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LucideTrash } from 'lucide-react';
import { toast } from 'sonner';
import { deleteTrading } from '../actions/delete-trading';
import { updateTradingStatus } from '../actions/update-trading-status';
import { TRADING_STATUS_LABELS } from '../constants';
import type { TradingStatus, TradingWithMetadata } from '../types';

type TradingMoreMenuProps = {
  trading: TradingWithMetadata;
  trigger: React.ReactElement;
};

function TradingMoreMenu({ trading, trigger }: TradingMoreMenuProps) {
  const [deleteButton, deleteDialog] = useConfirmDialog({
    action: deleteTrading.bind(null, trading.id),
    trigger: (
      <DropdownMenuItem disabled={!trading.permissions.canDeleteTrading}>
        <LucideTrash className="h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>
    ),
  });

  const handleUpdateTradingStatus = async (value: string) => {
    const promise = updateTradingStatus(trading.id, value as TradingStatus);

    toast.promise(promise, {
      loading: 'Updating status...',
    });

    const result = await promise;

    if (result.status === 'ERROR') {
      toast.error(result.message);
    } else if (result.status === 'SUCCESS') {
      toast.success(result.message);
    }
  };

  const tradingStatusRadioGroupItems = (
    <DropdownMenuRadioGroup
      value={trading.status}
      onValueChange={handleUpdateTradingStatus}
    >
      {(Object.keys(TRADING_STATUS_LABELS) as Array<TradingStatus>).map(
        (key) => (
          <DropdownMenuRadioItem key={key} value={key}>
            {TRADING_STATUS_LABELS[key]}
          </DropdownMenuRadioItem>
        ),
      )}
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

export default TradingMoreMenu;
