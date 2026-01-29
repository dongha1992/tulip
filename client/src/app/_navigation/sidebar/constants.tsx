import { homePath } from '@/paths';
import { LucideLibrary } from 'lucide-react';

import { NavItem } from './types';

export const navItems: NavItem[] = [
  {
    title: 'home',
    icon: <LucideLibrary />,
    href: homePath(),
  },
];

export const closedClassName =
  'text-background opacity-0 transition-all duration-300 group-hover:z-40 group-hover:ml-4 group-hover:rounded group-hover:bg-foreground group-hover:p-2 group-hover:opacity-100';
