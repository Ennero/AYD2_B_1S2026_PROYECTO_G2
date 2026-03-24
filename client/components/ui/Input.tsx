import { cn } from "@/lib/utils/cn"
import { forwardRef } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#0C0C0A", letterSpacing: "0.01em" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm transition-all",
            "placeholder:text-text-warm-mist text-text-primary bg-white",
            "border focus:outline-none",
            error
              ? "border-error focus:ring-2 focus:ring-error/30 focus:border-error"
              : "border-black/15 focus:ring-2 focus:ring-primary/30 focus:border-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-text-muted">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"
export default Input
