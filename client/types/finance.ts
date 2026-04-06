export type FinanceInvoiceStatus =
  | "BORRADOR"
  | "CERTIFICADA"
  | "ENVIADA"
  | "PAGADA"
  | "RECHAZADA"

export interface FinanceInvoice {
  invoiceId: string
  invoiceNumber: string
  orderNumber: string
  clientName: string
  clientNit: string
  clientAddress: string
  serviceDescription: string
  issueDate: string
  deliveredAt: string
  dueDate: string
  subtotalAmount: number
  taxAmount: number
  taxRate?: number
  currencyCode?: string
  exchangeRateFromUsd?: number
  totalAmount: number
  status: FinanceInvoiceStatus
  paymentState?: {
    hasPendingPayment: boolean
    hasApprovedPayment: boolean
  }
  felUuid?: string
  certifiedAt?: string
  sentAt?: string
  pdfPath?: string
}

export type FinancePaymentMethod = "TRANSFERENCIA" | "CHEQUE" | "TARJETA"
export type FinancePaymentStatus = "PENDIENTE" | "APROBADO" | "RECHAZADO"

export interface FinancePayment {
  paymentId: string
  invoiceId: string
  invoiceNumber: string
  clientName: string
  currencyCode?: string
  amount: number
  method: FinancePaymentMethod
  paymentDate: string
  status: FinancePaymentStatus
}

export interface FinanceRate {
  vehicleTypeId: number
  typeCode: string
  typeName: string
  minCapacityTon: number
  maxCapacityTon: number | null
  baseCurrency?: string
  ratePerKm: number
}

export interface FinanceSummary {
  draftInvoicesPendingReview: number
  certifiedInvoicesPendingSend: number
  pendingPayments: number
  collectedAmount: number
}

export interface FinanceMockState {
  invoices: FinanceInvoice[]
  payments: FinancePayment[]
  rates: FinanceRate[]
  updatedAt: string
}
