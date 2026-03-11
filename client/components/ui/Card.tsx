import { cn } from "@/lib/utils/cn"

type CardVariant = "default" | "surface" | "primary"

interface CardProps {
  variant?: CardVariant
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-black/5",
  surface: "bg-surface",
  primary: "bg-primary text-white",
}

export default function Card({ variant = "default", children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl shadow-sm p-6 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  )
}
