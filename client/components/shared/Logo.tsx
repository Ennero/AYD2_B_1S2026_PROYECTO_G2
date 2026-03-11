import Link from "next/link"

/**
 * Logo reutilizable de LOGITRANS.
 * Usa la fuente Montserrat Alternates del design system.
 */
export default function Logo({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeClasses = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-4xl",
  }

  return (
    <Link href="/" className="inline-block">
      <span
        className={`font-heading font-bold tracking-tight text-primary ${sizeClasses[size]}`}
      >
        LOGITRANS
      </span>
    </Link>
  )
}
