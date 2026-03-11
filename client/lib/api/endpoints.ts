/* ===========================
   API Endpoints — Constantes
   Centraliza todas las rutas del backend.
   Uso: import { ENDPOINTS } from "@/lib/api/endpoints"
   =========================== */

const API_VERSION = "/api/v1"

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
    LIST: `${API_VERSION}/clientes`,
    CREATE: `${API_VERSION}/clientes`,
    GET: (id: string) => `${API_VERSION}/clientes/${id}`,
    UPDATE: (id: string) => `${API_VERSION}/clientes/${id}`,
  },

  CONTRATOS: {
    LIST: `${API_VERSION}/contratos`,
    CREATE: `${API_VERSION}/contratos`,
    GET: (id: string) => `${API_VERSION}/contratos/${id}`,
    FORMALIZAR: (id: string) => `${API_VERSION}/contratos/${id}/formalizar`,
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
  FACTURAS: {
    LIST: `${API_VERSION}/facturas`,
    GET: (id: string) => `${API_VERSION}/facturas/${id}`,
    CERTIFICAR: (id: string) => `${API_VERSION}/facturas/${id}/certificar`,
    RECHAZAR: (id: string) => `${API_VERSION}/facturas/${id}/rechazar`,
  },
} as const
