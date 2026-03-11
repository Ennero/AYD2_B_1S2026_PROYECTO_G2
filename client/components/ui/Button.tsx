import { cn } from "@/lib/utils/cn"
import { forwardRef } from "react"

type ButtonVariant = "primary" | "secondary" | "outline" | "surface" | "danger" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary hover:bg-primary-hover active:bg-primary-active text-white",
  secondary: "bg-secondary hover:opacity-90 text-white",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  surface: "bg-surface hover:opacity-90 text-text-primary",
  danger: "bg-error hover:opacity-90 text-white",
  ghost: "text-text-primary hover:bg-black/5",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm rounded-md",
  md: "px-6 py-2.5 rounded-lg",
  lg: "px-8 py-3.5 text-lg rounded-xl",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "font-medium transition-colors cursor-pointer inline-flex items-center justify-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"
export default Button
