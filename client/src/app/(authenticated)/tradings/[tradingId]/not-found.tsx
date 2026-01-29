import { Placeholder } from '@/components/placeholder';
import { Button } from '@/components/ui/button';
import { tradingsPath } from '@/paths';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Placeholder
      label="잘못된 페이지입니다."
      button={
        <Button asChild variant="outline">
          <Link href={tradingsPath()}>돌아가기</Link>
        </Button>
      }
    />
  );
}
