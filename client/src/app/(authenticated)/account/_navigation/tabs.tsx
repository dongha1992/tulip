'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { accountPasswordPath, accountProfilePath } from '@/paths';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AccountTabs = () => {
  const pathName = usePathname();

  return (
    <Tabs value={pathName.split('/').at(-1)}>
      <TabsList>
        <TabsTrigger value="profile">
          <Link href={accountProfilePath()}>내 계정</Link>
        </TabsTrigger>
        <TabsTrigger value="password">
          <Link href={accountPasswordPath()}>비밀번호</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export { AccountTabs };
