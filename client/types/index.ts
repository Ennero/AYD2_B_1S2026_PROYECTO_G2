/* ===========================
   Shared Types — Tipos globales del frontend
   =========================== */

export type { UserRole, UserProfile, LoginResponse, PaginatedResponse, ErrorResponse } from "@/lib/api/types"

/** Estado genérico para componentes con data fetching */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/** Props comunes de páginas con params dinámicos */
export interface PageProps<T = Record<string, string>> {
  params: Promise<T>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/** Opciones de navegación del Navbar/Sidebar */
export interface NavItem {
  label: string
  href: string
  icon?: string
}
