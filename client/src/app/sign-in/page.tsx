import { CardCompact } from '@/components/card-compact';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { passwordForgotPath, signUpPath } from '@/paths';
import Link from 'next/link';

const SignInPage = () => {
  return (
    <div className="flex-1 flex flex-col justify-center items-center">
      <CardCompact
        title="로그인"
        description=""
        className="w-full max-w-[420px] animate-fade-from-top"
        content={<SignInForm />}
        footer={
          <>
            <Link className="text-sm text-muted-foreground" href={signUpPath()}>
              계정이 없습니까?
            </Link>

            <Link
              className="text-sm text-muted-foreground"
              href={passwordForgotPath()}
            >
              비밀번호를 잊으셨나요?
            </Link>
          </>
        }
      />
    </div>
  );
};

export default SignInPage;
