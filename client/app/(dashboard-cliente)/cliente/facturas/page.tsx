"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Receipt,
  Search,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils/cn"

/* ─── Types ─────────────────────────────────────────────────────────────── */

type InvoiceStatus = "BORRADOR" | "CERTIFICADA" | "ENVIADA" | "PAGADA" | "RECHAZADA"

interface Invoice {
  invoiceId: string
  invoiceNumber: string
  serviceDescription: string
  felUuid: string | null
  totalAmount: number
  status: InvoiceStatus
  dueDate: string
  issueDate: string
  pdfPath: string | null
  hasPendingPayment: boolean
}

interface InvoicePage {
  items: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Card {
  cardId: string
  cardAlias: string
  cardholderName: string
  cardBrand: string
  lastFour: string
  expirationMonth: number
  expirationYear: number
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatQ(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const STATUS_META: Record<InvoiceStatus, { label: string; cls: string }> = {
  BORRADOR:    { label: "Borrador",    cls: "bg-gray-100 text-gray-600" },
  CERTIFICADA: { label: "Certificada", cls: "bg-blue-50 text-blue-700" },
  ENVIADA:     { label: "Pendiente",   cls: "bg-amber-50 text-amber-700" },
  PAGADA:      { label: "Pagada",      cls: "bg-[#53B73E]/10 text-[#3A8E2A]" },
  RECHAZADA:   { label: "Rechazada",   cls: "bg-red-50 text-red-600" },
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  )
}

/* ─── Payment Modal ──────────────────────────────────────────────────────── */

type PayMethod = "TARJETA" | "TRANSFERENCIA"

function PaymentModal({
  invoice,
  cards,
  onClose,
  onSuccess,
}: {
  invoice: Invoice
  cards: Card[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [method, setMethod] = useState<PayMethod>("TARJETA")
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.cardId ?? "")
  const [bankReference, setBankReference] = useState("")
  const [bankName, setBankName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (method === "TARJETA" && !selectedCardId) {
      toast.error("Selecciona una tarjeta guardada")
      return
    }
    if (method === "TRANSFERENCIA" && !bankReference.trim()) {
      toast.error("El número de referencia es requerido")
      return
    }

    setLoading(true)
    try {
      await api.post(ENDPOINTS.CLIENT.PAYMENTS, {
        invoiceId: invoice.invoiceId,
        method,
        ...(method === "TARJETA" ? { cardId: selectedCardId } : {}),
        ...(method === "TRANSFERENCIA" ? { bankReference, bankName } : {}),
      })
      toast.success("Pago registrado. El área financiera lo aprobará en breve.")
      onSuccess()
      onClose()
    } catch {
      // api client shows toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary text-white px-6 py-5 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-extrabold text-white">Registrar Pago</h2>
            <p className="text-white/70 text-sm mt-0.5">
              {invoice.invoiceNumber} · {formatQ(invoice.totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Method tabs */}
          <div className="flex border-b border-gray-200">
            {(["TARJETA", "TRANSFERENCIA"] as PayMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex items-center gap-2 pb-2 px-4 text-sm font-bold transition-all cursor-pointer border-b-2",
                  method === m
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text-primary"
                )}
              >
                {m === "TARJETA" ? <CreditCard size={15} /> : <Building2 size={15} />}
                {m === "TARJETA" ? "Tarjeta" : "Depósito / Transferencia"}
              </button>
            ))}
          </div>

          {/* TARJETA */}
          {method === "TARJETA" && (
            <div className="space-y-4">
              {cards.length === 0 ? (
                <div className="text-center py-6 text-text-muted text-sm space-y-1">
                  <CreditCard size={28} className="mx-auto text-gray-300" />
                  <p>Sin tarjetas guardadas. Agrega una en la sección de abajo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-primary">
                    Tarjeta guardada
                  </label>
                  {cards.map((c) => (
                    <label
                      key={c.cardId}
                      className={cn(
                        "flex items-center gap-3 border rounded-xl p-4 cursor-pointer transition-colors",
                        selectedCardId === c.cardId
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="card"
                        value={c.cardId}
                        checked={selectedCardId === c.cardId}
                        onChange={() => setSelectedCardId(c.cardId)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="text-sm font-bold text-text-primary">
                          {c.cardAlias}
                        </p>
                        <p className="text-xs text-text-muted">
                          {c.cardBrand} · {c.cardholderName} · •••• {c.lastFour}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRANSFERENCIA */}
          {method === "TRANSFERENCIA" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3 text-sm text-blue-800">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <p>
                  Deposite el monto exacto a la cuenta{" "}
                  <strong>Monetaria BI 001-9999-2</strong> a nombre de{" "}
                  <strong>LogiTrans S.A.</strong> e ingresa el número de referencia.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-bold text-text-primary block mb-1">
                    No. de referencia / autorización *
                  </label>
                  <input
                    type="text"
                    value={bankReference}
                    onChange={(e) => setBankReference(e.target.value)}
                    placeholder="Ej. REF-0998342"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-text-primary block mb-1">
                    Banco (opcional)
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ej. Banco Industrial"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleSubmit()}
              disabled={loading || (method === "TARJETA" && cards.length === 0)}
              className={cn(
                "flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors",
                (loading || (method === "TARJETA" && cards.length === 0)) && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : method === "TARJETA" ? (
                <Lock size={14} />
              ) : (
                <Send size={14} />
              )}
              {method === "TARJETA" ? "Procesar Pago" : "Enviar Comprobante"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Add Card Form ──────────────────────────────────────────────────────── */

function AddCardForm({ onAdded }: { onAdded: (card: Card) => void }) {
  const [form, setForm] = useState({
    cardAlias: "",
    cardholderName: "",
    cardBrand: "VISA",
    lastFour: "",
    expirationMonth: "",
    expirationYear: "",
  })
  const [loading, setLoading] = useState(false)

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cardAlias || !form.cardholderName || !form.lastFour || !form.expirationMonth || !form.expirationYear) {
      toast.error("Completa todos los campos")
      return
    }
    if (form.lastFour.length !== 4 || !/^\d{4}$/.test(form.lastFour)) {
      toast.error("Los últimos 4 dígitos deben ser números")
      return
    }
    setLoading(true)
    try {
      const res = await api.post<{ data: Card }>(ENDPOINTS.CLIENT.CARDS, {
        cardAlias: form.cardAlias,
        cardholderName: form.cardholderName,
        cardBrand: form.cardBrand,
        lastFour: form.lastFour,
        expirationMonth: Number(form.expirationMonth),
        expirationYear: Number(form.expirationYear),
      })
      toast.success("Tarjeta guardada correctamente")
      onAdded(res.data.data)
      setForm({ cardAlias: "", cardholderName: "", cardBrand: "VISA", lastFour: "", expirationMonth: "", expirationYear: "" })
    } catch {
      // api client shows toast
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full bg-white"

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="rounded-2xl border border-dashed border-primary/40 bg-primary/3 p-5 space-y-4">
      <h4 className="font-extrabold text-primary text-base">Agregar Tarjeta</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Alias *</label>
          <input className={inputCls} placeholder="Ej. Visa corporativa" value={form.cardAlias} onChange={(e) => set("cardAlias", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Nombre del titular *</label>
          <input className={inputCls} placeholder="Ana Morales" value={form.cardholderName} onChange={(e) => set("cardholderName", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Tipo *</label>
          <select className={inputCls} value={form.cardBrand} onChange={(e) => set("cardBrand", e.target.value)}>
            <option value="VISA">VISA</option>
            <option value="MASTERCARD">MASTERCARD</option>
            <option value="AMEX">AMEX</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Últimos 4 dígitos *</label>
          <input className={inputCls} placeholder="4455" maxLength={4} value={form.lastFour} onChange={(e) => set("lastFour", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Mes expiración *</label>
          <select className={inputCls} value={form.expirationMonth} onChange={(e) => set("expirationMonth", e.target.value)}>
            <option value="">Mes</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-text-muted block mb-1">Año expiración *</label>
          <select className={inputCls} value={form.expirationYear} onChange={(e) => set("expirationYear", e.target.value)}>
            <option value="">Año</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          Guardar Tarjeta
        </button>
      </div>
    </form>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FacturasPage() {
  const [invoicePage, setInvoicePage] = useState<InvoicePage | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  // ── Fetch invoices ────────────────────────────────────────────────────
  const fetchInvoices = useCallback(async (q: string, p: number) => {
    setLoadingInvoices(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10" })
      if (q) params.set("search", q)
      const res = await api.get<{ data: InvoicePage }>(
        `${ENDPOINTS.CLIENT.INVOICES}?${params.toString()}`
      )
      setInvoicePage(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      setLoadingInvoices(false)
    }
  }, [])

  // ── Fetch cards ───────────────────────────────────────────────────────
  const fetchCards = async () => {
    setLoadingCards(true)
    try {
      const res = await api.get<{ data: Card[] }>(ENDPOINTS.CLIENT.CARDS)
      setCards(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => { void fetchInvoices(search, page) }, [search, page, fetchInvoices])
  useEffect(() => { void fetchCards() }, [])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleRemoveCard = async (cardId: string) => {
    try {
      await api.delete(ENDPOINTS.CLIENT.CARD(cardId))
      toast.success("Tarjeta eliminada")
      setCards((prev) => prev.filter((c) => c.cardId !== cardId))
    } catch {
      // api client shows toast
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center">
          <Receipt size={20} className="text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight uppercase">
          Mis Facturas
        </h1>
      </div>

      {/* ── Invoice table card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-6 space-y-6">

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar por No. de factura…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full border border-gray-200 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-primary hover:bg-primary-hover text-white w-10 h-10 rounded-full flex items-center justify-center shadow transition-colors cursor-pointer shrink-0"
            >
              <Search size={16} />
            </button>
            {search && (
              <button
                onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0"
                title="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {invoicePage && (
            <span className="text-xs text-text-muted shrink-0">
              {invoicePage.total} resultado{invoicePage.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        {loadingInvoices ? (
          <TableSkeleton />
        ) : !invoicePage || invoicePage.items.length === 0 ? (
          <div className="text-center py-16 text-text-muted space-y-2">
            <FileText size={36} className="mx-auto text-gray-300" />
            <p className="font-semibold">Sin facturas{search ? ` para "${search}"` : ""}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">No. Factura</th>
                  <th className="text-left pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">Descripción</th>
                  <th className="text-left pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">No. Autorización</th>
                  <th className="text-right pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">Monto</th>
                  <th className="text-center pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">Estado</th>
                  <th className="text-center pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoicePage.items.map((inv) => {
                  const meta = STATUS_META[inv.status]
                  const canPay = inv.status === "ENVIADA"
                  return (
                    <tr key={inv.invoiceId} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-2 font-bold text-text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-2 text-text-muted max-w-[200px] truncate">
                        {inv.serviceDescription}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-xs text-text-muted">
                        {inv.felUuid ?? "—"}
                      </td>
                      <td className="py-3.5 px-2 text-right font-extrabold text-text-primary">
                        {formatQ(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <span className={cn("inline-block px-2.5 py-1 rounded-full text-xs font-bold", meta.cls)}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center justify-center gap-2">
                          {/* PDF button */}
                          <button
                            title="Descargar PDF"
                            disabled={!inv.pdfPath}
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                              inv.pdfPath
                                ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer shadow-sm"
                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                            )}
                          >
                            <FileText size={15} />
                          </button>
                          {/* Pay button */}
                          {canPay && !inv.hasPendingPayment ? (
                            <button
                              onClick={() => setPayingInvoice(inv)}
                              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-3 py-1.5 rounded-lg shadow-sm text-xs transition-colors cursor-pointer"
                            >
                              <CreditCard size={13} /> Pagar
                            </button>
                          ) : canPay && inv.hasPendingPayment ? (
                            <span
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700"
                              title="Ya registraste un pago. Espera la aprobación del área financiera."
                            >
                              <RefreshCw size={12} /> En revisión
                            </span>
                          ) : (
                            <span className={cn(
                              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold",
                              inv.status === "PAGADA" ? "bg-[#53B73E]/10 text-[#3A8E2A]" : "bg-gray-100 text-gray-400"
                            )}>
                              <CheckCircle size={12} />
                              {inv.status === "PAGADA" ? "Pagada" : "No disponible"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {invoicePage && invoicePage.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex gap-1">
              {Array.from({ length: invoicePage.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-sm font-bold transition-colors cursor-pointer",
                    p === invoicePage.page
                      ? "bg-[#e8d5c4] text-primary shadow-sm"
                      : "bg-white border border-gray-200 text-text-muted hover:bg-gray-50"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#e8d5c4] text-primary disabled:opacity-40 hover:bg-[#d4bca9] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(invoicePage.totalPages, p + 1))}
                disabled={page === invoicePage.totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#e8d5c4] text-primary disabled:opacity-40 hover:bg-[#d4bca9] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tarjetas Guardadas ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-primary flex items-center gap-2">
            <CreditCard size={18} />
            Tarjetas Guardadas
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/8 border border-primary/15 rounded-full px-3 py-1">
            GET /api/client/cards · POST /api/client/cards
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card list */}
          <div className="space-y-3">
            {loadingCards ? (
              <div className="space-y-2 animate-pulse">
                {[0, 1].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm space-y-1 border border-dashed border-gray-200 rounded-2xl">
                <CreditCard size={28} className="mx-auto text-gray-300" />
                <p>Sin tarjetas guardadas</p>
              </div>
            ) : (
              cards.map((c) => (
                <div
                  key={c.cardId}
                  className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between bg-gray-50/50"
                >
                  <div>
                    <p className="font-extrabold text-text-primary text-sm">{c.cardAlias}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {c.cardBrand} · {c.cardholderName} · •••• {c.lastFour} · {String(c.expirationMonth).padStart(2,"0")}/{c.expirationYear}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleRemoveCard(c.cardId)}
                    className="w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-colors cursor-pointer shrink-0"
                    title="Eliminar tarjeta"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add card form */}
          <AddCardForm
            onAdded={(card) => setCards((prev) => [...prev, card])}
          />
        </div>
      </div>

      {/* ── Payment Modal ──────────────────────────────────────────────── */}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          cards={cards}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            // Refresh invoice list so status is reflected after finance approval
            void fetchInvoices(search, page)
          }}
        />
      )}
    </div>
  )
}
