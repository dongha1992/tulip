import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/actions/sign-out';
import { accountPasswordPath, accountProfilePath } from '@/paths';
import { User } from '@prisma/client';
import { LucideLock, LucideLogOut, LucideUser } from 'lucide-react';
import Link from 'next/link';

type AccountDropdownProps = {
  user: User;
};

const AccountDropdown = ({ user }: AccountDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer">
        <Avatar>
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href={accountProfilePath()} className="flex">
            <LucideUser className="mr-2 h-4 w-4" />
            <span>계정</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={accountPasswordPath()} className="flex">
            <LucideLock className="mr-2 h-4 w-4" />
            <span>비밀번호</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={signOut} className="flex">
            <LucideLogOut className="mr-2 h-4 w-4" />
            <button type="submit">로그아웃</button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { AccountDropdown };
