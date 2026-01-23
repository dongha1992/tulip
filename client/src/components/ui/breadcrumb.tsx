import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef, ReactNode } from "react"
import { createContext, forwardRef, useContext } from "react"


type BreadcrumbProps = ComponentPropsWithoutRef<"nav"> & {
  separator?: ReactNode
}

const BreadcrumbContext = createContext<{
  separator?: ReactNode
} | null>(null)


const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator = ">", className, ...props }, ref) => (
    <BreadcrumbContext.Provider value={{ separator }}>
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={className}
        {...props}
      />
    </BreadcrumbContext.Provider>
  )
)
Breadcrumb.displayName = "Breadcrumb"


const BreadcrumbList = forwardRef<
  HTMLOListElement,
  ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"


const BreadcrumbItem = forwardRef<
  HTMLLIElement,
  ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  ComponentPropsWithoutRef<"a">
>(({ className, ...props }, ref) => (
  <a
    ref={ref}
    className={cn("transition-colors hover:text-foreground", className)}
    {...props}
  />
))
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = forwardRef<
  HTMLLIElement,
  ComponentPropsWithoutRef<"li">
>(({ children, className, ...props }, ref) => {
  const ctx = useContext(BreadcrumbContext)
  return (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn("select-none", className)}
      {...props}
    >
      {children ?? ctx?.separator ?? ">"}
    </li>
  )
})
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <span aria-hidden="true">…</span>
    <span className="sr-only">More</span>
  </span>
))
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
}
