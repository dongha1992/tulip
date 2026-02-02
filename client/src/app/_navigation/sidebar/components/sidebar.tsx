'use client';

import { cn } from '@/lib/utils';
import { signInPath, signUpPath } from '@/paths';
import { getActivePath } from '@/utils/get-active-path';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { navItems } from '../constants';
import { NavItem } from '../types';
import { SidebarItem } from './sidebar-item';

const Sidebar = () => {
  const [isTransition, setTransition] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const pathName = usePathname();

  const handleToggle = (open: boolean) => {
    setTransition(true);
    setOpen(open);
    setTimeout(() => setTransition(false), 200);
  };

  const { activeIndex } = getActivePath(
    pathName,
    navItems.map((navItem) => navItem.href),
    [signInPath(), signUpPath()],
  );

  return (
    <nav
      className={cn(
        'animate-sidebar-from-left',
        'h-screen border-r pt-24',
        isTransition && 'duration-200',
        isOpen ? 'md:w-60 w-[78px]' : 'w-[78px]',
      )}
      onMouseEnter={() => handleToggle(true)}
      onMouseLeave={() => handleToggle(false)}
    >
      <div className="px-3 py-2">
        <nav className="space-y-2">
          {navItems.map((navItem: NavItem, index: number) => (
            <SidebarItem
              key={navItem.title}
              isOpen={isOpen}
              isActive={activeIndex === index}
              navItem={navItem}
            />
          ))}
        </nav>
      </div>
    </nav>
  );
};

export { Sidebar };
