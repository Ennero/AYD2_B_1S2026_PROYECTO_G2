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
    /**
     * GET /api/pilot/orders
     * Lista todos los viajes asignados al piloto autenticado.
     * Query params opcionales: status, startDate, endDate, etc.
     */
    LIST: `${API_VERSION}/pilot/orders`,

    /**
     * GET /api/pilot/orders/{ORDER_ID}
     * Detalle completo del viaje: info, piloto, tiempos y bitácora.
     */
    GET: (id: string) => `${API_VERSION}/pilot/orders/${id}`,

    /**
     * PATCH /api/pilot/orders/{ORDER_ID}/status
     * Body: { status: "EN_TRANSITO" }
     * Cambia el estado de LISTA_PARA_DESPACHO → EN_TRANSITO y registra DISPATCHED_AT.
     */
    START: (orderId: string) => `/api/pilot/orders/${orderId}/status`,

    /**
     * POST /api/pilot/orders/{ORDER_ID}/logs
     * Body: { eventType, description }
     * Inserta un nuevo evento en ORDER_ROUTE_LOGS.
     */
    ADD_LOG: (orderId: string) => `/api/pilot/orders/${orderId}/logs`,

    /**
     * PATCH /api/pilot/orders/{ORDER_ID}/deliver
     * Body: { receiverName, receiverSignatureBase64, deliveryEvidenceBase64[] }
     * Marca la orden como ENTREGADA y dispara TRG_AUTO_CREATE_DRAFT_INVOICE.
     */
    DELIVER: (orderId: string) => `/api/pilot/orders/${orderId}/deliver`,
  },

  // ── Agente Logístico ─────────────────────
  LOGISTICS: {
    DASHBOARD_SUMMARY: `/api/logistics/dashboard/summary`,
    ORDERS_LIST: `/api/logistics/orders`,
    ORDER_DETAIL: (id: string) => `/api/logistics/orders/${id}`,
    UNIT_BINOMIALS: `/api/logistics/unit-binomials`,
    ROUTES: `/api/logistics/routes`,
    ASSIGN_ORDER: (id: string) => `/api/logistics/orders/${id}/assignment`,
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
