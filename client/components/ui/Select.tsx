import { cn } from "@/lib/utils/cn"
import { forwardRef } from "react"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: "#0C0C0A", letterSpacing: "0.01em" }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full rounded-lg px-4 py-2.5 text-sm bg-white text-text-primary",
            "border focus:outline-none transition-all appearance-none cursor-pointer",
            error
              ? "border-error focus:ring-2 focus:ring-error/30"
              : "border-black/15 focus:ring-2 focus:ring-primary/30 focus:border-primary",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    )
  }
)

Select.displayName = "Select"
export default Select
