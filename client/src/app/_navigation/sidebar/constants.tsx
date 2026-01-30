import { accountProfilePath, allTradingPath, homePath } from '@/paths';
import { BadgeDollarSign, LucideLibrary, User } from 'lucide-react';

import { NavItem } from './types';

export const navItems: NavItem[] = [
  {
    title: '홈',
    icon: <LucideLibrary />,
    href: homePath(),
  },

  {
    title: '매매 기록',
    icon: <BadgeDollarSign />,
    href: allTradingPath(),
  },
  {
    title: '내 계정',
    icon: <User />,
    href: accountProfilePath(),
  },
];

export const closedClassName =
  'text-background opacity-0 transition-all duration-300 group-hover:z-40 group-hover:ml-4 group-hover:rounded group-hover:bg-foreground group-hover:p-2 group-hover:opacity-100';
