// ------- Enums de estado ---------

export type OrderStatus =
    | "REGISTRADA"
    | "ASIGNADA"
    | "LISTA_PARA_DESPACHO"
    | "EN_TRANSITO"
    | "ENTREGADA"
    | "BLOQUEADA" // orden bliqueada por mora / crédito excedido
    | "CANCELADA"


export type EventType = 
    | "SALIDA"
    | "PUNTO_CONTROL"
    | "ADUANA"
    | "INCIDENTE"
    | "LLEGADA"
    | "OTRO"

// -------- Respuesta base de la API ---------

export interface ApiResponse<T> {
    message: string
    data: T
}

// ------ GET /api/pilot/orders ------
// Un viaje resumido tal como llega en el listado

export interface ViajeResumen {
    orderId: string
    orderNumber: string
    origin: string
    destination: string
    status: OrderStatus
    clientName?: string
    cargoTyoe?: string // Tipo de mercancia
    declaredWeigthTon?: number // Peso declarado en toneladas
    scheduledDate: string // Fecha programa de salida
}

// ------ GET /api/pilot/orders/{ORDER_ID} ------
// Detalle completo de un viaje para la vista de monitoreo

export interface LogEvento {
    logId: string
    eventType: EventType
    eventTime: string
    description: string
}

export interface ViajeDetalle {
    orderId: string
    orderNumber: string
    origin: string
    destination: string
    status: OrderStatus
    clientName: string
    pilotName: string
    estimatedHours: number
    declaredWeigthTon: number
    cargoType: string
    scheduledDate?: string
    dispatchedAt?: string // LLama al cambiar a EN_TRANSITO
    deliveredAt?: string  // LLama al cambiar a ENTREGADA
    logs: LogEvento[]
}

// ------ PATCH /api/pilot/orders/{ORDER_ID}/status ------

export interface CambiarStatusPayload {
    status: "EN_TRANSITO"
}

export interface CambiarStatusResponse {
    orderId: string
    status: OrderStatus
    dispatchedAt: string
}

// ------ POST /api/pilot/orders/{ORDER_ID}/logs ------

export interface RegistrarLogPayload {
    eventType: EventType
    description: string
}

export interface RegistrarLogResponse {
    logId: string
    eventTime: string
}

// ------ PATCH /api/pilot/orders/{ORDER_ID}/deliver ------

export interface EntregaPayload {
    receiverName: string
    receiverSignatureBase64: string          // canvas → base64 PNG
    deliveryEvidenceBase64: string[]         // arreglo de fotos base64 (opcional)
    deliveredAt?: string                     // ISO string; si no se envía, backend usa NOW()
    notes?: string                           // Observaciones opcionales
}

export interface EntregaResponse {
    orderId: string
    status: "ENTREGADA"
    deliveredAt: string
    receiverSignaturePath: string
}

// ------ Filtros del dashboard ------

export interface FiltrosViaje {
    startDate?: string
    endDate?: string
    clientName?: string
    origin?: string
    destination?: string
    cargoType?: string
    sortByWeight?: "ASC" | "DESC"
    status?: OrderStatus
}