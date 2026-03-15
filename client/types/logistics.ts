// ============================================================
// types/logistics.ts — Tipos para el módulo Agente Logístico
// ============================================================

import type { OrderStatus } from "@/types/pilot"

// ------ GET /api/logistics/dashboard/summary ------

export interface DashboardSummary {
  pendingOrders: number
  availableUnits: number
}

// ------ GET /api/logistics/orders ------

export interface OrdenResumen {
  orderId: string
  orderNumber: string
  clientName: string
  origin: string
  destination: string
  declaredWeightTon: number
  cargoType: string
  status: OrderStatus
  requestedAt: string
}

// ------ GET /api/logistics/orders/:id ------

export interface ContractRouteInfo {
  contractRouteId: string
  routeId: string
  origin: string
  destination: string
  estimatedHours: number
}

export interface OrdenDetalle {
  orderId: string
  orderNumber: string
  status: OrderStatus
  requestedAt: string
  scheduledPickupAt?: string
  origin: string
  destination: string
  declaredWeightTon: number
  cargoType: string
  requiresRefrigeration: boolean
  clientName: string
  clientPhone: string
  clientEmail: string
  clientAddress: string
  contractRoutes: ContractRouteInfo[]
  assignedUnit?: {
    unitId: string
    plate: string
    vehicleType: string
    pilotName: string
  }
}

// ------ GET /api/logistics/unit-binomials?orderId=... ------

export interface UnitBinomial {
  binomialId: string
  plate: string
  vehicleType: string
  capacityTon: number
  hasRefrigeration: boolean
  pilotName: string
  pilotLicense: string
}

// ------ GET /api/logistics/routes ------

export interface RouteInfo {
  routeId: string
  origin: string
  destination: string
  estimatedHours: number
  isActive: boolean
}

// ------ PATCH /api/logistics/orders/:id/assignment ------

export interface AssignOrderPayload {
  contractRouteId: string
  binomialId: string
  scheduledDeparture: string
}

// ------ Filtros de la lista de órdenes ------

export interface FiltrosOrden {
  status?: OrderStatus
  startDate?: string
  endDate?: string
  clientId?: string
}
