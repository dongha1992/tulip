'use client';

import { EMPTY_ACTION_STATE } from '@/components/form/utils/to-action-state';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/actions/sign-out';
import { LucideLoaderCircle, LucideLogOut } from 'lucide-react';
import { useActionState } from 'react';

const SignOutMenuItem = () => {
  const [, formAction, isPending] = useActionState(signOut, EMPTY_ACTION_STATE);

  return (
    <DropdownMenuItem
      asChild
      onSelect={(e: Event) => {
        e.preventDefault();
      }}
    >
      <form action={formAction} className="flex w-full">
        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center text-left"
        >
          {isPending ? (
            <LucideLoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LucideLogOut className="mr-2 h-4 w-4" />
          )}
          <span>로그아웃</span>
        </button>
      </form>
    </DropdownMenuItem>
  );
};

export { SignOutMenuItem };
