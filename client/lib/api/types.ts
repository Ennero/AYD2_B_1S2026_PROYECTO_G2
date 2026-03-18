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
  message: string
  data: {
    userId: string
    sessionUuid: string
    role: UserRole
    fullName: string
    token: string
  }
}

/** Perfil de usuario */
export interface UserProfile {
  userId: string
  role: UserRole
  fullName: string
  email?: string
}

/** Roles del sistema (Mayúsculas para coincidir con DB) */
export type UserRole =
  | "ADMIN"
  | "AGENTE_OPERATIVO"
  | "PILOTO"
  | "AGENTE_LOGISTICO"
  | "ENCARGADO_PATIO"
  | "AGENTE_FINANCIERO"
  | "CLIENTE"

/** Datos de Factura para Certificador */
export interface Invoice {
  invoiceId: string
  invoiceNumber: string
  issueDate: string
  totalAmount: number
  currency: string
  status: "BORRADOR" | "CERTIFICADA" | "RECHAZADA"
  clientName: string
  clientNit: string
  felUuid?: string
  rejectionReason?: string
}

/** Resumen del Dashboard del Certificador */
export interface CertifierSummary {
  pendingInvoices: number
  certifiedCount: number
}

/** Respuesta de error del API */
export interface ErrorResponse {
  message: string
  detail?: string
  errors?: Record<string, string[]>
}
