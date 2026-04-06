import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { FinanceInvoice, FinanceInvoiceStatus, FinancePayment, FinanceRate, FinanceSummary } from "@/types/finance"

interface BackendResponse<T> {
  message: string
  data: T
}

interface FinanceSummaryQuery {
  period?: "MONTHLY"
  year?: number
  month?: number
}

interface SubmitForCertificationBody {
  serviceDescription: string
  dueDate: string
  reviewConfirmed: boolean
}

interface FinanceInvoiceApi {
  invoiceId: string
  invoiceNumber: string
  orderId?: string | null
  orderNumber: string | null
  clientId?: string | null
  clientName: string
  clientNit: string
  clientAddress?: string | null
  serviceDescription?: string | null
  issueDate: string
  deliveredAt: string | null
  dueDate?: string | null
  status: FinanceInvoiceStatus
  currencyCode?: string | null
  exchangeRateFromUsd?: number | string | null
  taxRate?: number | string | null
  paymentState?: {
    hasPendingPayment: boolean
    hasApprovedPayment: boolean
  }
  subtotalAmount?: number | string | null
  taxAmount?: number | string | null
  totalAmount: number | string
  felUuid?: string | null
  certifiedAt?: string | null
  sentAt?: string | null
  pdfPath?: string | null
}

interface FinancePaymentApi {
  paymentId: string
  invoiceId: string
  invoiceNumber: string | null
  clientName: string | null
  currencyCode?: string | null
  amount: number | string
  method: FinancePayment["method"]
  paymentDate: string
  status: FinancePayment["status"]
}

interface FinanceRateApi {
  vehicleTypeId: number
  typeCode: string
  typeName: string
  minCapacityTon?: number | null
  maxCapacityTon?: number | null
  baseCurrency?: string | null
  ratePerKm: number | string
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toFinanceInvoice(invoice: FinanceInvoiceApi): FinanceInvoice {
  return {
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.orderNumber ?? "-",
    clientName: invoice.clientName,
    clientNit: invoice.clientNit,
    clientAddress: invoice.clientAddress ?? "",
    serviceDescription: invoice.serviceDescription ?? "",
    issueDate: invoice.issueDate,
    deliveredAt: invoice.deliveredAt ?? "",
    dueDate: invoice.dueDate ?? "",
    currencyCode: invoice.currencyCode ?? "GTQ",
    exchangeRateFromUsd: toNumber(invoice.exchangeRateFromUsd),
    subtotalAmount: toNumber(invoice.subtotalAmount),
    taxAmount: toNumber(invoice.taxAmount),
    taxRate: toNumber(invoice.taxRate),
    totalAmount: toNumber(invoice.totalAmount),
    status: invoice.status,
    paymentState: invoice.paymentState,
    felUuid: invoice.felUuid ?? undefined,
    certifiedAt: invoice.certifiedAt ?? undefined,
    sentAt: invoice.sentAt ?? undefined,
    pdfPath: invoice.pdfPath ?? undefined,
  }
}

function toFinancePayment(payment: FinancePaymentApi): FinancePayment {
  return {
    paymentId: payment.paymentId,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoiceNumber ?? "-",
    clientName: payment.clientName ?? "-",
    currencyCode: payment.currencyCode ?? undefined,
    amount: toNumber(payment.amount),
    method: payment.method,
    paymentDate: payment.paymentDate,
    status: payment.status,
  }
}

function toFinanceRate(rate: FinanceRateApi): FinanceRate {
  return {
    vehicleTypeId: rate.vehicleTypeId,
    typeCode: rate.typeCode,
    typeName: rate.typeName,
    baseCurrency: rate.baseCurrency ?? 'USD',
    minCapacityTon: toNumber(rate.minCapacityTon),
    maxCapacityTon: rate.maxCapacityTon === null || rate.maxCapacityTon === undefined ? null : toNumber(rate.maxCapacityTon),
    ratePerKm: toNumber(rate.ratePerKm),
  }
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.set(key, String(value))
    }
  })
  const raw = query.toString()
  return raw ? `?${raw}` : ""
}

export async function fetchFinanceSummary(query: FinanceSummaryQuery = {}): Promise<FinanceSummary> {
  const endpoint = `${ENDPOINTS.FINANCE.SUMMARY}${buildQuery({
    period: query.period,
    year: query.year,
    month: query.month,
  })}`
  const response = await api.get<BackendResponse<FinanceSummary>>(endpoint, { silentError: true })
  return response.data.data
}

export async function fetchFinanceInvoices(status?: FinanceInvoiceStatus): Promise<FinanceInvoice[]> {
  const endpoint = `${ENDPOINTS.FINANCE.INVOICES}${buildQuery({ status })}`
  const response = await api.get<BackendResponse<FinanceInvoiceApi[]>>(endpoint, { silentError: true })
  return response.data.data.map(toFinanceInvoice)
}

export async function fetchFinanceInvoiceById(invoiceId: string): Promise<FinanceInvoice> {
  const response = await api.get<BackendResponse<FinanceInvoiceApi>>(ENDPOINTS.FINANCE.INVOICE_DETAIL(invoiceId), {
    silentError: true,
  })
  return toFinanceInvoice(response.data.data)
}

export async function submitFinanceInvoiceForCertification(
  invoiceId: string,
  payload: SubmitForCertificationBody,
): Promise<void> {
  await api.patch<BackendResponse<unknown>>(ENDPOINTS.FINANCE.SUBMIT_FOR_CERTIFICATION(invoiceId), payload, {
    silentError: true,
  })
}

export async function sendFinanceInvoice(invoiceId: string): Promise<void> {
  await api.patch<BackendResponse<unknown>>(ENDPOINTS.FINANCE.SEND_INVOICE(invoiceId), undefined, {
    silentError: true,
  })
}

export async function fetchFinancePayments(status?: FinancePayment["status"]): Promise<FinancePayment[]> {
  const endpoint = `${ENDPOINTS.FINANCE.PAYMENTS}${buildQuery({ status })}`
  const response = await api.get<BackendResponse<FinancePaymentApi[]>>(endpoint, { silentError: true })
  return response.data.data.map(toFinancePayment)
}

export async function approveFinancePayment(paymentId: string): Promise<void> {
  await api.patch<BackendResponse<unknown>>(ENDPOINTS.FINANCE.APPROVE_PAYMENT(paymentId), undefined, {
    silentError: true,
  })
}

export async function fetchFinanceRates(): Promise<FinanceRate[]> {
  const response = await api.get<BackendResponse<FinanceRateApi[]>>(ENDPOINTS.FINANCE.RATES, { silentError: true })
  return response.data.data.map(toFinanceRate)
}

export async function updateFinanceRate(vehicleTypeId: number, ratePerKm: number): Promise<FinanceRate> {
  const response = await api.patch<BackendResponse<FinanceRateApi>>(
    ENDPOINTS.FINANCE.UPDATE_RATE(vehicleTypeId),
    { ratePerKm },
    { silentError: true },
  )
  return toFinanceRate(response.data.data)
}