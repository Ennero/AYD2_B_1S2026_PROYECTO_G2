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
  // Amber fill — main CTA
  primary:   "bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-semibold tracking-wide",
  // Dark fill — secondary action
  secondary: "bg-dark-card text-text-ivory border border-border-dark hover:bg-[#2a2a27]",
  // Amber border — ghost CTA
  outline:   "border border-primary text-primary hover:bg-primary hover:text-white",
  // White fill on ivory bg
  surface:   "bg-surface hover:bg-[#F0EDE6] text-text-primary border border-border",
  // Destructive
  danger:    "bg-error hover:opacity-90 text-white",
  // Transparent
  ghost:     "text-text-muted hover:text-text-primary hover:bg-black/5",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm rounded",
  md: "px-6 py-2.5 rounded-lg",
  lg: "px-8 py-3.5 text-base rounded-lg",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "font-medium transition-all cursor-pointer inline-flex items-center justify-center gap-2",
          "disabled:opacity-40 disabled:cursor-not-allowed",
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
