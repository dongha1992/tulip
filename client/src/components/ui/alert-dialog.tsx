'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import {
  cloneElement,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

type SlotProps = { children: ReactElement; [key: string]: any };
function Slot({ children, ...props }: SlotProps) {
  return cloneElement(children, {
    ...props,
    ...children.props,
    className: cn(props.className, children.props.className),
    onClick: (...args: any[]) => {
      props.onClick?.(...args);
      children.props.onClick?.(...args);
    },
  });
}

type AlertDialogContext = {
  open: boolean;
  setOpen: (v: boolean) => void;
  contentId: string;
  titleId: string;
  descId: string;
  disableBackdropClose?: boolean;
  disableEscClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onAction?: () => void | Promise<void>;
};

const AlertDialogContext = createContext<AlertDialogContext | null>(null);

function useAlertDialogContext() {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('<AlertDialog /> 내부에서 사용해야 함.');
  return context;
}

type AlertDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  disableBackdropClose?: boolean;
  disableEscClose?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onAction?: () => void | Promise<void>;
  children: ReactNode;
};

const AlertDialog = ({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: AlertDialogProps) => {
  const [uncontrolled, setUncontrolled] = useState(!!defaultOpen);
  const isControlled = open !== undefined;
  const value = isControlled ? !!open : uncontrolled;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolled(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  const reactId = useId();
  const context = useMemo<AlertDialogContext>(
    () => ({
      open: value,
      setOpen,
      contentId: `alertdialog-content-${reactId}`,
      titleId: `alertdialog-title-${reactId}`,
      descId: `alertdialog-desc-${reactId}`,
      disableBackdropClose: props.disableBackdropClose,
      disableEscClose: props.disableEscClose,
      initialFocusRef: props.initialFocusRef,
      onAction: props.onAction,
    }),
    [
      value,
      setOpen,
      reactId,
      props.disableBackdropClose,
      props.disableEscClose,
      props.initialFocusRef,
      props.onAction,
    ],
  );

  return (
    <AlertDialogContext.Provider value={context}>
      {props.children}
    </AlertDialogContext.Provider>
  );
};

type TriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

const AlertDialogTrigger = forwardRef<HTMLButtonElement, TriggerProps>(
  ({ asChild, ...props }, ref) => {
    const { setOpen } = useAlertDialogContext();
    const Comp: React.ElementType = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        {...props}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          props.onClick?.(e);
          if (e.defaultPrevented) return;
          setOpen(true);
        }}
      />
    );
  },
);
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

type PortalProps = {
  children: ReactNode;
  container?: HTMLElement | null;
};

const AlertDialogPortal = ({ children, container }: PortalProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, container ?? document.body);
};

type OverlayProps = HTMLAttributes<HTMLDivElement>;

const AlertDialogOverlay = forwardRef<HTMLDivElement, OverlayProps>(
  ({ className, ...props }, ref) => {
    const { open, setOpen, disableBackdropClose } = useAlertDialogContext();
    if (!open) return null;

    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className,
        )}
        data-state={open ? 'open' : 'closed'}
        onMouseDown={(e) => {
          props.onMouseDown?.(e);
          if (disableBackdropClose) return;
          if (e.target === e.currentTarget) setOpen(false);
        }}
      />
    );
  },
);
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

function getFocusable(container: HTMLElement) {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    "[tabindex]:not([tabindex='-1'])",
  ].join(',');
  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'),
  );
}

type ContentProps = HTMLAttributes<HTMLDivElement>;
const AlertDialogContent = forwardRef<HTMLDivElement, ContentProps>(
  ({ className, ...props }, ref) => {
    const {
      open,
      setOpen,
      contentId,
      titleId,
      descId,
      disableEscClose,
      initialFocusRef,
    } = useAlertDialogContext();

    const localRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const lastActiveRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (!open) return;

      lastActiveRef.current = document.activeElement as HTMLElement | null;

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const t = window.setTimeout(() => {
        // initialFocusRef 우선, 없으면 첫 포커서블
        const target =
          initialFocusRef?.current ??
          (localRef.current ? getFocusable(localRef.current)[0] : null);
        target?.focus?.();
      }, 0);

      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = prevOverflow;
        lastActiveRef.current?.focus?.();
      };
    }, [open, initialFocusRef]);

    useEffect(() => {
      if (!open || disableEscClose) return;
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, disableEscClose, setOpen]);

    if (!open) return null;

    return (
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <div
          {...props}
          ref={localRef}
          id={contentId}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'sm:rounded-lg',
            className,
          )}
          data-state={open ? 'open' : 'closed'}
          onKeyDown={(e) => {
            props.onKeyDown?.(e);
            if (e.key !== 'Tab') return;
            // 최소 focus trap (Tab 순환)
            const el = localRef.current;
            if (!el) return;
            const focusables = getFocusable(el);
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
              if (active === first || !el.contains(active)) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (active === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}
          onMouseDown={(e) => {
            // content 클릭이 overlay로 전파되지 않게
            props.onMouseDown?.(e);
            e.stopPropagation();
          }}
        />
      </AlertDialogPortal>
    );
  },
);
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

type TitleProps = HTMLAttributes<HTMLHeadingElement>;
const AlertDialogTitle = forwardRef<HTMLHeadingElement, TitleProps>(
  ({ className, ...props }, ref) => {
    const { titleId } = useAlertDialogContext();
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn('text-lg font-semibold', className)}
        {...props}
      />
    );
  },
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

type DescProps = HTMLAttributes<HTMLParagraphElement>;
const AlertDialogDescription = forwardRef<HTMLParagraphElement, DescProps>(
  ({ className, ...props }, ref) => {
    const { descId } = useAlertDialogContext();
    return (
      <p
        ref={ref}
        id={descId}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);
AlertDialogDescription.displayName = 'AlertDialogDescription';

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};
const AlertDialogAction = forwardRef<HTMLButtonElement, ActionProps>(
  ({ className, asChild, ...props }, ref) => {
    const { setOpen, onAction } = useAlertDialogContext();
    const Comp: React.ElementType = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(buttonVariants(), className)}
        {...props}
        onClick={async (e: MouseEvent<HTMLButtonElement>) => {
          props.onClick?.(e);
          if (e.defaultPrevented) return;
          try {
            await onAction?.();
          } finally {
            setOpen(false);
          }
        }}
      />
    );
  },
);
AlertDialogAction.displayName = 'AlertDialogAction';

type CancelProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};
const AlertDialogCancel = forwardRef<HTMLButtonElement, CancelProps>(
  ({ className, asChild, ...props }, ref) => {
    const { setOpen } = useAlertDialogContext();
    const Comp: React.ElementType = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : 'button'}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'mt-2 sm:mt-0',
          className,
        )}
        {...props}
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          props.onClick?.(e);
          if (e.defaultPrevented) return;
          setOpen(false);
        }}
      />
    );
  },
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
};

