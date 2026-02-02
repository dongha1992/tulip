import { CardCompact } from '@/components/card-compact';
import { Heading } from '@/components/heading';
import { PasswordChangeForm } from '@/features/password/components/password-change-form';
import { AccountTabs } from '../_navigation/tabs';

const PasswordPage = () => {
  return (
    <div className="flex-1 flex flex-col gap-y-8">
      <Heading title="비밀번호" description="" tabs={<AccountTabs />} />

      <div className="flex-1 flex flex-col items-center gap-y-4 animate-fade-from-top">
        <CardCompact
          title="비밀번호 변경"
          description=""
          className="w-full max-w-[420px]"
          content={<PasswordChangeForm />}
        />
      </div>
    </div>
  );
};

export default PasswordPage;
