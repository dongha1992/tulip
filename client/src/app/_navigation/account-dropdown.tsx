import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutMenuItem } from '@/features/auth/components/sign-out-client-wrapper';
import { accountPasswordPath, accountProfilePath } from '@/paths';
import { User } from '@prisma/client';
import { LucideLock, LucideUser } from 'lucide-react';
import Link from 'next/link';

type AccountDropdownProps = {
  user: User;
};

const AccountDropdown = ({ user }: AccountDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Avatar>
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={accountProfilePath()} className="flex">
            <LucideUser className="mr-2 h-4 w-4" />
            <span>계정</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={accountPasswordPath()} className="flex">
            <LucideLock className="mr-2 h-4 w-4" />
            <span>비밀번호</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { AccountDropdown };
