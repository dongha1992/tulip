import { CardCompact } from '@/components/card-compact';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { signInPath } from '@/paths';
import Link from 'next/link';

const SignUpPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <CardCompact
        title="회원가입"
        description=""
        className="w-full max-w-[420px] animate-fade-from-top"
        content={<SignUpForm />}
        footer={
          <Link className="text-sm text-muted-foreground" href={signInPath()}>
            계정이 있습니까? 로그인하세요.
          </Link>
        }
      />
    </div>
  );
};

export default SignUpPage;
