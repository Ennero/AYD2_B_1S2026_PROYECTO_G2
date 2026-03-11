import { cn } from "@/lib/utils/cn"

/** Badge de estado con colores del design system */

type StatusVariant = "success" | "warning" | "error" | "info" | "default"

interface StatusBadgeProps {
  variant?: StatusVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  success: "bg-accent/20 text-secondary border-accent/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  error: "bg-error/20 text-error border-error/30",
  info: "bg-primary/10 text-primary border-primary/20",
  default: "bg-text-muted/10 text-text-muted border-text-muted/20",
}

export default function StatusBadge({ variant = "default", children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
