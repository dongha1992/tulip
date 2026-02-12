import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        // 부정 - Figma Badge/red #E73445
        destructive:
          'bg-[var(--color-badge-red-bg)] text-[var(--color-badge-red)]',
        // 긍정 - Figma Badge/blue #3182F6
        positive:
          'bg-[var(--color-badge-blue-bg)] text-[var(--color-badge-blue)]',
        // 중립 - Figma Gray
        neutral:
          'bg-[var(--color-badge-gray-bg)] text-[var(--color-badge-gray)]',
        // 다소부정 - Figma Badge/orange #F2792C
        'slightly-negative':
          'bg-[var(--color-badge-orange-bg)] text-[var(--color-badge-orange)]',
        // 다소긍정 - Figma Badge/green #029359
        'slightly-positive':
          'bg-[var(--color-badge-green-bg)] text-[var(--color-badge-green)]',
        outline: 'border border-input bg-background',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Badge = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
));
Badge.displayName = 'Badge';

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;
export { Badge, badgeVariants };
