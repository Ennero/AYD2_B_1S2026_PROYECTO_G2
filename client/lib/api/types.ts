/* ===========================
   API Types — Tipos de respuesta del backend
   =========================== */

/** Respuesta genérica paginada */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Respuesta de login */
export interface LoginResponse {
  access_token: string
  token_type: string
  user: UserProfile
}

/** Perfil de usuario */
export interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: UserRole
}

/** Roles del sistema */
export type UserRole =
  | "agente_operativo"
  | "piloto"
  | "agente_logistico"
  | "encargado_patio"
  | "certificador_fel"

/** Respuesta de error del API */
export interface ErrorResponse {
  message: string
  detail?: string
  errors?: Record<string, string[]>
}
