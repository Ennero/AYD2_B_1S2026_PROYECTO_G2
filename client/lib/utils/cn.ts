import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility para combinar clases de Tailwind de forma segura.
 * Usa clsx para condicionales y twMerge para resolver conflictos.
 *
 * @example
 * cn("bg-primary text-white", isActive && "bg-primary-active", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
