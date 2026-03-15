/* ===========================
   API Endpoints — Constantes
   Centraliza todas las rutas del backend.
   Uso: import { ENDPOINTS } from "@/lib/api/endpoints"
   =========================== */

const API_VERSION = "/api"

export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────
  AUTH: {
    LOGIN: `${API_VERSION}/auth/login`,
    REGISTER: `${API_VERSION}/auth/register`,
    FORGOT_PASSWORD: `${API_VERSION}/auth/forgot-password`,
    REFRESH: `${API_VERSION}/auth/refresh`,
    ME: `${API_VERSION}/auth/me`,
  },

  // ── Agente Operativo ─────────────────────
  CLIENTES: {
    LIST: `/api/operations/clients`,
    CREATE: `/api/operations/clients`,
    GET: (id: string) => `/api/operations/clients/${id}`,
  },

  CONTRATOS: {
    LIST: `/api/operations/contracts`,
    CREATE: `/api/operations/contracts`,
    GET: (id: string) => `/api/operations/contracts/${id}`,
  },

  // ── Piloto ───────────────────────────────
  VIAJES: {
    LIST: `${API_VERSION}/viajes`,
    GET: (id: string) => `${API_VERSION}/viajes/${id}`,
    MONITOREO: (id: string) => `${API_VERSION}/viajes/${id}/monitoreo`,
    BITACORA: (id: string) => `${API_VERSION}/viajes/${id}/bitacora`,
  },

  // ── Agente Logístico ─────────────────────
  ORDENES: {
    LIST: `${API_VERSION}/ordenes`,
    GET: (id: string) => `${API_VERSION}/ordenes/${id}`,
    ASIGNAR_RUTA: (id: string) => `${API_VERSION}/ordenes/${id}/asignar-ruta`,
  },

  RUTAS: {
    LIST: `${API_VERSION}/rutas`,
    CREATE: `${API_VERSION}/rutas`,
    GET: (id: string) => `${API_VERSION}/rutas/${id}`,
  },

  // ── Encargado de Patio ───────────────────
  CARGAS: {
    LIST: `${API_VERSION}/cargas`,
    GET: (id: string) => `${API_VERSION}/cargas/${id}`,
    FORMALIZAR: (id: string) => `${API_VERSION}/cargas/${id}/formalizar`,
  },

  // ── Certificador FEL ─────────────────────
  CERTIFIER: {
    SUMMARY: `/api/certifier/dashboard/summary`,
    INVOICES: `/api/certifier/invoices`,
    VALIDATE_NIT: (id: string) => `/api/certifier/invoices/${id}/validate-nit`,
    CERTIFY: (id: string) => `/api/certifier/invoices/${id}/certify`,
    RECHAZAR: (id: string) => `/api/certifier/invoices/${id}/rechazar`,
  },
} as const
