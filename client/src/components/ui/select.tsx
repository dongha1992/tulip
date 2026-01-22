"use client"

import { cn } from "@/lib/utils"
import { createContext, forwardRef, useCallback, useContext, useState } from "react"


type SelectContextValue = {
  value?: string
  onValueChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
}

const SelectContext = createContext<SelectContextValue | null>(null)


type SelectProps = {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
  children: React.ReactNode
}

const Select = ({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  children,
}: SelectProps) => { 
const [inner, setInner] = useState(defaultValue ?? "")
  const isControlled = value != null
  const currentValue = isControlled ? value! : inner

  const handleChange = useCallback(
    (v: string) => {
      if (!isControlled) setInner(v)
      onValueChange?.(v)
    },
    [isControlled, onValueChange]
  )

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleChange,
        placeholder,
        disabled,
      }}
    >
      {children}
    </SelectContext.Provider>
  )
}

const useSelect = () => {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error("<Select /> 내부에서 사용해야 합니다")
  return ctx
}

const SelectTrigger = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  const { value, onValueChange, placeholder, disabled } = useSelect()

  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      disabled={disabled ?? props.disabled}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}

    
      {children}
    </select>
  )
})
SelectTrigger.displayName = "SelectTrigger"


type SelectItemProps = React.OptionHTMLAttributes<HTMLOptionElement> & {
  value: string
}
const SelectItem = ({ className, children, ...props }: SelectItemProps) => {
  return (
    <option className={className} {...props}>
      {children}
    </option>
  )
}

const SelectValue = ({ className }: { className?: string }) => {
  const { value } = useSelect()
  return <span className={cn(className)}>{value}</span>
}

export { Select, SelectItem, SelectTrigger, SelectValue }
