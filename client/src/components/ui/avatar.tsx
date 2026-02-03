import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
} from 'react';

type AvatarContextValue = {
  imageLoaded: boolean;
  setImageLoaded: (v: boolean) => void;
};

const AvatarContext = createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error(
      '해당 컴포넌트는 반드시 <Avatar /> 내에서 사용되어야 합니다.',
    );
  }
  return ctx;
}

const Avatar = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
        <span
          ref={ref}
          className={cn(
            'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
            className,
          )}
          {...props}
        />
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = 'Avatar';

const AvatarFallback = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  const { imageLoaded } = useAvatarContext();

  if (imageLoaded) return null;

  return (
    <span
      ref={ref}
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className,
      )}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

type AvatarImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'width' | 'height'
> & {
  src: string;
  width?: number;
  height?: number;
};

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, onLoad, onError, width, height, src, ...props }, ref) => {
    const { setImageLoaded } = useAvatarContext();

    const fallbackSize = 40;
    const finalWidth = typeof width === 'number' ? width : fallbackSize;
    const finalHeight = typeof height === 'number' ? height : fallbackSize;

    return (
      <Image
        ref={ref}
        src={src}
        alt={props.alt || ''}
        width={finalWidth}
        height={finalHeight}
        className={cn('aspect-square h-full w-full object-cover', className)}
        {...props}
        onLoad={(e) => {
          setImageLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setImageLoaded(false);
          onError?.(e);
        }}
      />
    );
  },
);
AvatarImage.displayName = 'AvatarImage';

export { Avatar, AvatarFallback, AvatarImage };
