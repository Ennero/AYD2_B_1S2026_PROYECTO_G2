"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Receipt,
  Search,
  X,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
}

interface InvoicePage {
  items: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
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

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FacturasPage() {
  const [invoicePage, setInvoicePage] = useState<InvoicePage | null>(null)
  const [loadingInvoices, setLoadingInvoices] = useState(true)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)

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

  useEffect(() => { void fetchInvoices(search, page) }, [search, page, fetchInvoices])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
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
                  <th className="text-center pb-3 px-2 font-extrabold text-text-primary text-xs uppercase tracking-wide">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoicePage.items.map((inv) => {
                  const meta = STATUS_META[inv.status]
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
                          {inv.status === "PAGADA" && (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#53B73E]/10 text-[#3A8E2A]">
                              <CheckCircle size={12} /> Pagada
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
    </div>
  )
}
