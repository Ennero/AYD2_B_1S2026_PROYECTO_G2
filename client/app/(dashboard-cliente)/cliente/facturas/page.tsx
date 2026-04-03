"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  Receipt, Search, X, CheckCircle, FileText,
  ChevronLeft, ChevronRight, Eye,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

type InvoiceStatus = "BORRADOR" | "CERTIFICADA" | "ENVIADA" | "PAGADA" | "RECHAZADA"

interface Invoice {
  invoiceId: string
  invoiceNumber: string
  serviceDescription: string
  felUuid: string | null
  totalAmount: number
  subtotalAmount: number
  taxAmount: number
  taxRate?: number
  currencyCode?: "GTQ" | "USD" | "HNL"
  status: InvoiceStatus
  dueDate: string
  issueDate: string
  certifiedAt: string | null
  sentAt: string | null
  clientName: string
  clientNit: string
  clientAddress: string
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

function formatCurrency(n: number, currencyCode: "GTQ" | "USD" | "HNL" = "GTQ") {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDate(d: string | null) {
  if (!d) return "—"
  try { return new Date(d).toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }) }
  catch { return d }
}

const STATUS_META: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  BORRADOR:    { label: "Borrador",    color: "#6B6260", bg: "rgba(107,98,96,0.07)" },
  CERTIFICADA: { label: "Certificada", color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  ENVIADA:     { label: "Pendiente",   color: "#C9924B", bg: "rgba(201,146,75,0.10)" },
  PAGADA:      { label: "Pagada",      color: "#3A8E2A", bg: "rgba(58,142,42,0.08)" },
  RECHAZADA:   { label: "Rechazada",   color: "#E53E3E", bg: "rgba(229,62,62,0.08)" },
}

/* ─── Invoice Detail Modal ──────────────────────────────────────────────── */

function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const meta = STATUS_META[invoice.status]

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: "6px",
          width: "100%", maxWidth: "540px", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(12,12,10,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber top strip */}
        <div style={{ height: "3px", background: "#C9924B" }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "4px",
              background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Receipt size={16} style={{ color: "#6B6260" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
                {invoice.invoiceNumber}
              </h2>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "2px 8px", borderRadius: "3px",
                background: meta.bg, color: meta.color,
                fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                {meta.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "4px", display: "flex",
              alignItems: "center", justifyContent: "center", background: "rgba(12,12,10,0.04)",
              border: "1px solid rgba(12,12,10,0.08)", color: "#9A9489", cursor: "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.08)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxHeight: "70vh", overflowY: "auto" }}>

          {/* Client info */}
          <div style={{ background: "#F5F2EC", borderRadius: "6px", padding: "1rem" }}>
            <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
              Datos del Cliente
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { label: "Nombre", value: invoice.clientName || "—" },
                { label: "NIT", value: invoice.clientNit || "—" },
              ].map((f) => (
                <div key={f.label}>
                  <p style={{ fontSize: "0.6rem", color: "#9A9489", marginBottom: "2px" }}>{f.label}</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0C0C0A" }}>{f.value}</p>
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "0.6rem", color: "#9A9489", marginBottom: "2px" }}>Dirección</p>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0C0C0A" }}>{invoice.clientAddress || "—"}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
              Descripción del Servicio
            </p>
            <p style={{ fontSize: "0.82rem", color: "#6B6260", lineHeight: 1.6 }}>
              {invoice.serviceDescription || "Sin descripción"}
            </p>
          </div>

          {/* Financial breakdown */}
          <div style={{
            background: "rgba(201,146,75,0.05)", border: "1px solid rgba(201,146,75,0.15)",
            borderRadius: "6px", padding: "1rem",
          }}>
            <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
              Desglose Financiero
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { label: "Subtotal", value: formatCurrency(invoice.subtotalAmount, invoice.currencyCode ?? "GTQ"), bold: false },
                {
                  label: `Impuesto (${((invoice.taxRate ?? 0.12) * 100).toFixed(0)}%)`,
                  value: formatCurrency(invoice.taxAmount, invoice.currencyCode ?? "GTQ"),
                  bold: false,
                },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                  <span style={{ color: "#9A9489" }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: "#6B6260" }}>{row.value}</span>
                </div>
              ))}
              <div style={{ height: "1px", background: "rgba(12,12,10,0.1)", margin: "4px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                <span style={{ fontWeight: 700, color: "#0C0C0A" }}>Total</span>
                <span style={{ fontWeight: 900, color: "#C9924B", letterSpacing: "-0.02em" }}>
                  {formatCurrency(invoice.totalAmount, invoice.currencyCode ?? "GTQ")}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              { label: "Fecha de Emisión", value: formatDate(invoice.issueDate) },
              { label: "Fecha de Vencimiento", value: formatDate(invoice.dueDate) },
              ...(invoice.certifiedAt ? [{ label: "Fecha de Certificación", value: formatDate(invoice.certifiedAt) }] : []),
              ...(invoice.sentAt ? [{ label: "Fecha de Envío", value: formatDate(invoice.sentAt) }] : []),
            ].map((f) => (
              <div key={f.label}>
                <p style={{ fontSize: "0.6rem", color: "#9A9489", marginBottom: "2px" }}>{f.label}</p>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0C0C0A" }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* FEL UUID */}
          {invoice.felUuid && (
            <div>
              <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                No. Autorización FEL
              </p>
              <p style={{
                fontFamily: "monospace", fontSize: "0.72rem", color: "#6B6260",
                background: "#F5F2EC", borderRadius: "4px", padding: "0.5rem 0.75rem",
                wordBreak: "break-all",
              }}>
                {invoice.felUuid}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(12,12,10,0.07)", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "0.55rem 1.5rem", borderRadius: "4px",
              background: "#C9924B", border: "none", color: "#ffffff",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "#b5833f")}
            onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FacturasPage() {
  const [invoicePage, setInvoicePage] = useState<InvoicePage | null>(null)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchInvoices = useCallback(async (q: string, p: number) => {
    setLoadingInvoices(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: "10" })
      if (q) params.set("search", q)
      const res = await api.get<{ data: InvoicePage }>(`${ENDPOINTS.CLIENT.INVOICES}?${params.toString()}`)
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

  const COL = "1.2fr 2fr 1.8fr 1fr 0.9fr 0.8fr"

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      )}

      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>FA</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Portal Cliente
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Mis Facturas
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Historial de facturación FEL con desglose financiero detallado.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Table card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
          style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", overflow: "hidden",
          }}>

          {/* Search bar */}
          <div style={{
            padding: "1rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
            display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
          }}>
            <div style={{ flex: 1, display: "flex", gap: "8px", minWidth: "200px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Buscar por No. de factura…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    paddingLeft: "32px", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem",
                    background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.12)",
                    borderRadius: "4px", color: "#0C0C0A", fontSize: "0.82rem", outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#C9924B")}
                  onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.12)")}
                />
              </div>
              <button
                onClick={handleSearch}
                style={{
                  width: "36px", height: "36px", borderRadius: "4px", display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: "#C9924B", border: "none", color: "#ffffff", cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#b5833f")}
                onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}
              >
                <Search size={15} />
              </button>
              {search && (
                <button
                  onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
                  style={{
                    width: "36px", height: "36px", borderRadius: "4px", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
                    color: "#9A9489", cursor: "pointer",
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
            {invoicePage && (
              <p style={{ fontSize: "0.62rem", color: "#9A9489", flexShrink: 0 }}>
                {invoicePage.total} resultado{invoicePage.total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Table header */}
          <div style={{
            display: "grid", gridTemplateColumns: COL,
            padding: "0.6rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
            background: "rgba(12,12,10,0.015)",
          }}>
            {["No. Factura", "Descripción", "No. Autorización", "Monto", "Estado", "Detalle"].map((h, idx) => (
              <p key={h} style={{
                fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489",
                textTransform: "uppercase", fontWeight: 700,
                textAlign: idx === 3 ? "right" : idx >= 4 ? "center" : "left",
              }}>{h}</p>
            ))}
          </div>

          {/* Rows */}
          {loadingInvoices ? (
            <div style={{ padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: "48px", borderRadius: "4px", background: "rgba(12,12,10,0.04)" }} />
              ))}
            </div>
          ) : !invoicePage || invoicePage.items.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <FileText size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "4px" }}>
                Sin facturas{search ? ` para "${search}"` : ""}
              </p>
            </div>
          ) : (
            <div>
              {invoicePage.items.map((inv, i) => {
                const meta = STATUS_META[inv.status]
                return (
                  <div
                    key={inv.invoiceId}
                    style={{
                      display: "grid", gridTemplateColumns: COL,
                      padding: "0.85rem 1.5rem", alignItems: "center",
                      borderBottom: i < invoicePage.items.length - 1 ? "1px solid rgba(12,12,10,0.05)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.02)")}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>
                      {inv.invoiceNumber}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#6B6260", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "0.5rem" }}>
                      {inv.serviceDescription || "—"}
                    </p>
                    <p style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#9A9489", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.felUuid ?? "—"}
                    </p>
                    <p style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0C0C0A", textAlign: "right", letterSpacing: "-0.02em" }}>
                      {formatCurrency(inv.totalAmount, inv.currencyCode ?? "GTQ")}
                    </p>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "2px 8px", borderRadius: "4px",
                        background: meta.bg, color: meta.color,
                        fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <button
                        title="Ver Detalle"
                        onClick={() => setSelectedInvoice(inv)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "4px", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)",
                          color: "#C9924B", cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = "rgba(201,146,75,0.15)"; e.currentTarget.style.borderColor = "#C9924B" }}
                        onMouseOut={e => { e.currentTarget.style.background = "rgba(201,146,75,0.08)"; e.currentTarget.style.borderColor = "rgba(201,146,75,0.2)" }}
                      >
                        <Eye size={13} />
                      </button>
                      {inv.status === "PAGADA" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "2px 7px", borderRadius: "4px",
                          background: "rgba(58,142,42,0.08)", color: "#3A8E2A",
                          fontSize: "0.52rem", fontWeight: 700,
                        }}>
                          <CheckCircle size={10} /> Pagada
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {invoicePage && invoicePage.totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0.85rem 1.5rem", borderTop: "1px solid rgba(12,12,10,0.07)",
            }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {Array.from({ length: invoicePage.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: "30px", height: "30px", borderRadius: "4px",
                      fontSize: "0.72rem", fontWeight: 700, cursor: "pointer",
                      background: p === invoicePage.page ? "#C9924B" : "none",
                      color: p === invoicePage.page ? "#ffffff" : "#6B6260",
                      border: p === invoicePage.page ? "1px solid #C9924B" : "1px solid rgba(12,12,10,0.12)",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    width: "30px", height: "30px", borderRadius: "4px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)",
                    color: page === 1 ? "rgba(201,146,75,0.3)" : "#C9924B",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(invoicePage.totalPages, p + 1))}
                  disabled={page === invoicePage.totalPages}
                  style={{
                    width: "30px", height: "30px", borderRadius: "4px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)",
                    color: page === invoicePage.totalPages ? "rgba(201,146,75,0.3)" : "#C9924B",
                    cursor: page === invoicePage.totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
