import { cn } from "@/lib/utils/cn"

type CardVariant = "default" | "surface" | "primary" | "dark"

interface CardProps {
  variant?: CardVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const variantStyles: Record<CardVariant, string> = {
  // White card on ivory bg — standard dashboard card
  default: "bg-white border border-black/7 shadow-sm",
  // Same as default but explicit
  surface: "bg-surface border border-black/7 shadow-sm",
  // Amber accent card
  primary: "bg-primary text-white",
  // Deep ink card — dark sections
  dark: "bg-dark-card border border-white/5 text-text-ivory",
}

export default function Card({ variant = "default", children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl p-6 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
