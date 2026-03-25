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
    LOGOUT: `${API_VERSION}/auth/logout`,
    REGISTER: `${API_VERSION}/auth/register`,
    FORGOT_PASSWORD: `${API_VERSION}/auth/forgot-password`,
    RECOVERY: `${API_VERSION}/auth/recovery`,
    RESET_PASSWORD: `${API_VERSION}/auth/password`,
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

  OPERATIONS: {
    ROUTES: `/api/operations/routes`,
    CARGO_TYPES: `/api/operations/cargo-types`,
    CARGO_TYPE: (id: string | number) => `/api/operations/cargo-types/${id}`,
    USERS: `/api/operations/users`,
    USER: (id: string | number) => `/api/operations/users/${id}`,
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
  CERTIFIER: {
    SUMMARY: `/api/certifier/dashboard/summary`,
    INVOICES: `/api/certifier/invoices`,
    VALIDATE_NIT: (id: string) => `/api/certifier/invoices/${id}/validate-nit`,
    CERTIFY: (id: string) => `/api/certifier/invoices/${id}/certify`,
    REJECT: (id: string) => `/api/certifier/invoices/${id}/reject`,
  },

  // ── Portal Cliente ───────────────────────
  CLIENT: {
    DASHBOARD_SUMMARY: `/api/client/dashboard/summary`,
    PROFILE: `/api/client/profile`,
    CHANGE_PASSWORD: `/api/client/profile/password`,
    ACCOUNT_STATEMENT: `/api/client/account-statement`,
    CARGO_TYPES: `/api/client/cargo-types`,
    CONTRACTS: `/api/client/contracts`,
    ACTIVE_CONTRACTS: `/api/client/contracts/active`,
    CONTRACT_DETAIL: (id: string) => `/api/client/contracts/${id}`,
    CONTRACT_ACCEPT: (id: string) => `/api/client/contracts/${id}/accept`,
    CONTRACT_REJECT: (id: string) => `/api/client/contracts/${id}/reject`,
    ORDERS: `/api/client/orders`,
    ORDER_TRACKING: (id: string) => `/api/client/orders/${id}/tracking`,
    INVOICES: `/api/client/invoices`,
    CONTACTS: `/api/client/contacts`,
    CONTACT: (id: string) => `/api/client/contacts/${id}`,
  },

  // ── Agente Financiero ───────────────────
  FINANCE: {
    SUMMARY: `/api/finance/dashboard/summary`,
    INVOICES: `/api/finance/invoices`,
    INVOICE_DETAIL: (id: string) => `/api/finance/invoices/${id}`,
    SUBMIT_FOR_CERTIFICATION: (id: string) => `/api/finance/invoices/${id}/submit-for-certification`,
    SEND_INVOICE: (id: string) => `/api/finance/invoices/${id}/send`,
    PAYMENTS: `/api/finance/payments`,
    APPROVE_PAYMENT: (id: string) => `/api/finance/payments/${id}/approve`,
    RATES: `/api/finance/rates`,
    UPDATE_RATE: (id: string | number) => `/api/finance/rates/${id}`,
  },
} as const
