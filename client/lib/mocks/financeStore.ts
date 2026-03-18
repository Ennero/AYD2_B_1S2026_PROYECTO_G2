import type {
  FinanceInvoice,
  FinanceInvoiceStatus,
  FinanceMockState,
  FinancePayment,
  FinanceRate,
  FinanceSummary,
} from "@/types/finance"

const STORAGE_KEY = "logitrans.finance.mock.v1"

const INITIAL_STATE: FinanceMockState = {
  invoices: [
    {
      invoiceId: "inv-031",
      invoiceNumber: "FAC-000031",
      orderNumber: "ORD-000001",
      clientName: "Cementos Progreso",
      clientNit: "1234567890123",
      clientAddress: "Zona 10, Ciudad de Guatemala",
      serviceDescription: "Servicio logistico de carga general - Ruta Puerto Barrios -> Ciudad de Guatemala",
      issueDate: "2026-03-12T15:30:00Z",
      deliveredAt: "2026-03-12T14:45:00Z",
      dueDate: "2026-04-11",
      subtotalAmount: 10000,
      taxAmount: 1200,
      totalAmount: 11200,
      status: "BORRADOR",
    },
    {
      invoiceId: "inv-032",
      invoiceNumber: "FAC-000032",
      orderNumber: "ORD-000002",
      clientName: "Alimentos del Norte",
      clientNit: "9876543210123",
      clientAddress: "Calzada Roosevelt 18-50, Mixco",
      serviceDescription: "Servicio logistico de carga refrigerada - Ruta Quetzaltenango -> Ciudad de Guatemala",
      issueDate: "2026-03-14T17:00:00Z",
      deliveredAt: "2026-03-14T16:20:00Z",
      dueDate: "2026-04-13",
      subtotalAmount: 8000,
      taxAmount: 960,
      totalAmount: 8960,
      status: "BORRADOR",
    },
    {
      invoiceId: "inv-033",
      invoiceNumber: "FAC-000033",
      orderNumber: "ORD-000003",
      clientName: "Aceros Centroamericanos",
      clientNit: "1122334455667",
      clientAddress: "Km 13.5 Carretera al Atlantico",
      serviceDescription: "Servicio logistico de cabezal trailer - Ruta Puerto Barrios -> Quetzaltenango",
      issueDate: "2026-03-10T10:30:00Z",
      deliveredAt: "2026-03-10T09:40:00Z",
      dueDate: "2026-04-09",
      subtotalAmount: 15000,
      taxAmount: 1800,
      totalAmount: 16800,
      status: "CERTIFICADA",
      felUuid: "3C7D8A4E-3D23-4ED8-B410-ABC123456789",
      certifiedAt: "2026-03-10T11:15:00Z",
    },
    {
      invoiceId: "inv-034",
      invoiceNumber: "FAC-000034",
      orderNumber: "ORD-000004",
      clientName: "Importadora Pacifico",
      clientNit: "9988776655443",
      clientAddress: "Puerto Barrios, Izabal",
      serviceDescription: "Servicio logistico internacional - Ruta Ciudad de Guatemala -> San Pedro Sula",
      issueDate: "2026-03-09T08:00:00Z",
      deliveredAt: "2026-03-08T22:10:00Z",
      dueDate: "2026-04-08",
      subtotalAmount: 22000,
      taxAmount: 2640,
      totalAmount: 24640,
      status: "ENVIADA",
      felUuid: "AC82CA7E-8AE1-4C4A-A8B7-7AE1C6D84012",
      certifiedAt: "2026-03-09T08:25:00Z",
      sentAt: "2026-03-09T08:31:00Z",
      pdfPath: "/files/invoices/FAC-000034.pdf",
    },
  ],
  payments: [
    {
      paymentId: "pay-001",
      invoiceId: "inv-033",
      invoiceNumber: "FAC-000033",
      clientName: "Aceros Centroamericanos",
      amount: 16800,
      method: "TRANSFERENCIA",
      bankName: "BAC",
      bankReference: "REF-789452",
      paymentDate: "2026-03-16T13:20:00Z",
      status: "PENDIENTE",
    },
    {
      paymentId: "pay-002",
      invoiceId: "inv-034",
      invoiceNumber: "FAC-000034",
      clientName: "Importadora Pacifico",
      amount: 24640,
      method: "CHEQUE",
      bankName: "G&T Continental",
      bankReference: "CHK-99881",
      paymentDate: "2026-03-15T09:40:00Z",
      status: "APROBADO",
    },
  ],
  rates: [
    {
      vehicleTypeId: 1,
      typeCode: "LIGHT",
      typeName: "Unidad Ligera",
      minCapacityTon: 0,
      maxCapacityTon: 3.5,
      ratePerKm: 8,
    },
    {
      vehicleTypeId: 2,
      typeCode: "HEAVY",
      typeName: "Camion Pesado",
      minCapacityTon: 10,
      maxCapacityTon: 12,
      ratePerKm: 12.5,
    },
    {
      vehicleTypeId: 3,
      typeCode: "TRAILER",
      typeName: "Cabezal Trailer",
      minCapacityTon: 22,
      maxCapacityTon: null,
      ratePerKm: 18,
    },
  ],
  updatedAt: "2026-03-17T12:00:00Z",
}

function cloneInitialState(): FinanceMockState {
  return JSON.parse(JSON.stringify(INITIAL_STATE)) as FinanceMockState
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function readState(): FinanceMockState {
  if (!isBrowser()) {
    return cloneInitialState()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seeded = cloneInitialState()
    writeState(seeded)
    return seeded
  }

  try {
    const parsed = JSON.parse(raw) as FinanceMockState
    if (!Array.isArray(parsed.invoices) || !Array.isArray(parsed.payments) || !Array.isArray(parsed.rates)) {
      throw new Error("Invalid state shape")
    }
    return parsed
  } catch {
    const seeded = cloneInitialState()
    writeState(seeded)
    return seeded
  }
}

function writeState(next: FinanceMockState): void {
  if (!isBrowser()) {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

function updateState(mutator: (state: FinanceMockState) => void): FinanceMockState {
  const current = readState()
  mutator(current)
  current.updatedAt = new Date().toISOString()
  writeState(current)
  return current
}

function pseudoFelUuid(): string {
  const part = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase()
  return `${part()}${part()}-${part()}-${part()}-${part()}-${part()}${part()}${part()}`
}

export function getFinanceState(): FinanceMockState {
  return readState()
}

export function resetFinanceState(): FinanceMockState {
  const seeded = cloneInitialState()
  writeState(seeded)
  return seeded
}

export function getFinanceSummary(): FinanceSummary {
  const state = readState()

  const draftInvoicesPendingReview = state.invoices.filter((invoice) => invoice.status === "BORRADOR").length
  const certifiedInvoicesPendingSend = state.invoices.filter((invoice) => invoice.status === "CERTIFICADA").length
  const pendingPayments = state.payments.filter((payment) => payment.status === "PENDIENTE").length
  const collectedAmount = state.payments
    .filter((payment) => payment.status === "APROBADO")
    .reduce((total, payment) => total + payment.amount, 0)

  return {
    draftInvoicesPendingReview,
    certifiedInvoicesPendingSend,
    pendingPayments,
    collectedAmount,
  }
}

export function listInvoicesByStatus(status?: FinanceInvoiceStatus): FinanceInvoice[] {
  const state = readState()
  const source = status ? state.invoices.filter((invoice) => invoice.status === status) : state.invoices
  return [...source].sort((a, b) => b.issueDate.localeCompare(a.issueDate))
}

export function getInvoiceById(invoiceId: string): FinanceInvoice | null {
  const state = readState()
  return state.invoices.find((invoice) => invoice.invoiceId === invoiceId) ?? null
}

export function submitInvoiceForCertification(invoiceId: string): FinanceInvoice {
  const state = updateState((draft) => {
    const invoice = draft.invoices.find((item) => item.invoiceId === invoiceId)
    if (!invoice) {
      throw new Error("Factura no encontrada")
    }
    if (invoice.status !== "BORRADOR") {
      throw new Error("Solo se puede enviar a certificacion una factura BORRADOR")
    }

    invoice.status = "CERTIFICADA"
    invoice.felUuid = pseudoFelUuid()
    invoice.certifiedAt = new Date().toISOString()
  })

  const updated = state.invoices.find((invoice) => invoice.invoiceId === invoiceId)
  if (!updated) {
    throw new Error("Factura no encontrada")
  }
  return updated
}

export function sendCertifiedInvoice(invoiceId: string): FinanceInvoice {
  const state = updateState((draft) => {
    const invoice = draft.invoices.find((item) => item.invoiceId === invoiceId)
    if (!invoice) {
      throw new Error("Factura no encontrada")
    }
    if (invoice.status !== "CERTIFICADA") {
      throw new Error("Solo se puede enviar una factura CERTIFICADA")
    }

    invoice.status = "ENVIADA"
    invoice.sentAt = new Date().toISOString()
    invoice.pdfPath = `/files/invoices/${invoice.invoiceNumber}.pdf`
  })

  const updated = state.invoices.find((invoice) => invoice.invoiceId === invoiceId)
  if (!updated) {
    throw new Error("Factura no encontrada")
  }
  return updated
}

export function listPaymentsByStatus(status?: FinancePayment["status"]): FinancePayment[] {
  const state = readState()
  const source = status ? state.payments.filter((payment) => payment.status === status) : state.payments
  return [...source].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

export function approvePayment(paymentId: string): FinancePayment {
  const state = updateState((draft) => {
    const payment = draft.payments.find((item) => item.paymentId === paymentId)
    if (!payment) {
      throw new Error("Pago no encontrado")
    }
    if (payment.status !== "PENDIENTE") {
      throw new Error("Solo se puede aprobar un pago PENDIENTE")
    }

    payment.status = "APROBADO"

    const invoice = draft.invoices.find((item) => item.invoiceId === payment.invoiceId)
    if (invoice && invoice.status !== "RECHAZADA") {
      invoice.status = "PAGADA"
    }
  })

  const updated = state.payments.find((payment) => payment.paymentId === paymentId)
  if (!updated) {
    throw new Error("Pago no encontrado")
  }
  return updated
}

export function listRates(): FinanceRate[] {
  return [...readState().rates].sort((a, b) => a.vehicleTypeId - b.vehicleTypeId)
}

export function updateRate(vehicleTypeId: number, ratePerKm: number): FinanceRate {
  if (!Number.isFinite(ratePerKm) || ratePerKm <= 0) {
    throw new Error("La tarifa debe ser mayor a 0")
  }

  const state = updateState((draft) => {
    const rate = draft.rates.find((item) => item.vehicleTypeId === vehicleTypeId)
    if (!rate) {
      throw new Error("Tarifa no encontrada")
    }

    rate.ratePerKm = Math.round(ratePerKm * 100) / 100
  })

  const updated = state.rates.find((rate) => rate.vehicleTypeId === vehicleTypeId)
  if (!updated) {
    throw new Error("Tarifa no encontrada")
  }
  return updated
}
