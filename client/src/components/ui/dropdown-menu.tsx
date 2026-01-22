"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, createContext, forwardRef, MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef, useState, type HTMLAttributes, type MouseEvent, type ReactNode, type RefObject } from "react";


type DropdownContext = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  contentRef: RefObject<HTMLDivElement>;
  triggerRef: RefObject<HTMLElement>;
};


const DropdownMenuContext = createContext<DropdownContext | null>(null);

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenu components must be used within <DropdownMenu />");
  return context;
}

type DropdownMenuProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};


const DropdownMenu = ({ open, defaultOpen, onOpenChange, children }: DropdownMenuProps) => {
 const [uncontrolledOpen, setUncontrolledOpen] = useState(!!defaultOpen);

  const isControlled = open !== undefined;
  const actualOpen = isControlled ? !!open : uncontrolledOpen;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolledOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );

  const toggle = useCallback(() => setOpen(!actualOpen), [actualOpen, setOpen]);

  const contentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  // close on outside click + ESC
  useEffect(() => {
    if (!actualOpen) return;

    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;

      const contentEl = contentRef.current;
      const triggerEl = triggerRef.current;

      if (contentEl?.contains(t)) return;
      if (triggerEl?.contains(t)) return;

      setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };


    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [actualOpen, setOpen]);

  const value: DropdownContext = useMemo(
    () => ({ open: actualOpen, setOpen, toggle, contentRef, triggerRef }),
    [actualOpen, setOpen, toggle]
  );

  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>;
}
 
type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;


const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, onClick, ...props }, ref) => {
    const { toggle, triggerRef } = useDropdownMenu();

    const setRefs = (node: HTMLButtonElement | null) => {
      // forwardRef + internal ref
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLButtonElement | null>).current = node;

      (triggerRef as MutableRefObject<HTMLElement | null>).current = node;
    };

    return (
      <button
        ref={setRefs}
        type="button"
        className={className}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          toggle();
        }}
        {...props}
      />
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";


type DropdownMenuContentProps = HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number; 
    side?: "top" | "bottom" | "left" | "right";
};

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, sideOffset = 4, style, ...props }, ref) => {
    const { open, contentRef } = useDropdownMenu();
    if (!open) return null;

    const setRefs = (node: HTMLDivElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as MutableRefObject<HTMLDivElement | null>).current = node;

      contentRef.current = node;
    };

    return (
      <div
        ref={setRefs}
        role="menu"
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
          className
        )}
        style={{ marginTop: sideOffset, ...style }}
        {...props}
      />
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";


type DropdownMenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  inset?: boolean;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void; 
};


const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, disabled, onClick, onSelect, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        className={cn(
          "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          "focus:bg-accent focus:text-accent-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
          inset && "pl-8",
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          onSelect?.(e);
        
          if (!e.defaultPrevented) setOpen(false);
        }}
        {...props}
      />
    );
  }
);

DropdownMenuItem.displayName = "DropdownMenuItem";

type DropdownMenuCheckboxItemProps = Omit<DropdownMenuItemProps, "children"> & {
  checked?: boolean;
  children?: ReactNode;
};

const DropdownMenuCheckboxItem = forwardRef<HTMLButtonElement, DropdownMenuCheckboxItemProps>(
  ({ className, checked, children, ...props }, ref) => {
    return (
      <DropdownMenuItem
        ref={ref}
        className={cn("pl-8", className)}
        {...props}
      >
        <span className="absolute left-2 inline-flex h-3.5 w-3.5 items-center justify-center text-xs">
          {checked ? "✓" : null}
        </span>
        {children}
      </DropdownMenuItem>
    );
  }
);
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

type DropdownMenuRadioGroupCtx = {
  value?: string;
  onValueChange?: (v: string) => void;
};

const DropdownMenuRadioGroupContext = createContext<DropdownMenuRadioGroupCtx | null>(null);

type DropdownMenuRadioGroupProps = {
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
};

const DropdownMenuRadioGroup = ({ value, onValueChange, children }: DropdownMenuRadioGroupProps) => {
  return (
    <DropdownMenuRadioGroupContext.Provider value={{ value, onValueChange }}>
      {children}
    </DropdownMenuRadioGroupContext.Provider>
  );
};

type DropdownMenuRadioItemProps = Omit<DropdownMenuItemProps, "children"> & {
  value: string;
  children?: ReactNode;
};


const DropdownMenuRadioItem = forwardRef<HTMLButtonElement, DropdownMenuRadioItemProps>(
  ({ className, value, children, onSelect, ...props }, ref) => {
    const group = useContext(DropdownMenuRadioGroupContext);
    const checked = group?.value === value;

    return (
      <DropdownMenuItem
        ref={ref}
        className={cn("pl-8", className)}
        onSelect={(e) => {
          group?.onValueChange?.(value);
          onSelect?.(e);
        }}
        {...props}
      >
        <span className="absolute left-2 inline-flex h-3.5 w-3.5 items-center justify-center text-[10px]">
          {checked ? "●" : null}
        </span>
        {children}
      </DropdownMenuItem>
    );
  }
);
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

type DropdownMenuLabelProps = HTMLAttributes<HTMLDivElement> & { inset?: boolean };
const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
      {...props}
    />
  )
);
DropdownMenuLabel.displayName = "DropdownMenuLabel";

type DropdownMenuSeparatorProps = HTMLAttributes<HTMLDivElement>;
const DropdownMenuSeparator = forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  )
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuGroup = ({ children }: { children: ReactNode }) => <>{children}</>;
const DropdownMenuPortal = ({ children }: { children: ReactNode }) => <>{children}</>;


const DropdownMenuSub = ({ children }: { children: ReactNode }) => <>{children}</>;
const DropdownMenuSubTrigger = DropdownMenuItem; 
const DropdownMenuSubContent = DropdownMenuContent;


const DropdownMenuShortcut = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup,
    DropdownMenuRadioItem, DropdownMenuSeparator,
    DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger
};
