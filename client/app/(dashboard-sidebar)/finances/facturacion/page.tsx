"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileSearch, Send, Mail, Search, X } from "lucide-react"
import { toast } from "sonner"
import { fetchFinanceInvoices, sendFinanceInvoice } from "@/lib/api/finance"
import type { FinanceInvoice } from "@/types/finance"

const EASE = [0.16, 1, 0.3, 1] as const

function normalize(v: string) { return v.trim().toLowerCase() }

const COL6 = "1fr 1fr 1.4fr 1fr 0.8fr 0.8fr"

/* ─── Table row ─────────────────────────────────── */
function InvoiceRow({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL6, gap: "0 1rem",
      alignItems: "center", padding: "0.85rem 1.25rem",
      background: "#ffffff", borderBottom: "1px solid rgba(12,12,10,0.06)",
      borderLeft: `3px solid ${accent}`,
      transition: "background 0.12s",
    }}
      onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.01)")}
      onMouseOut={e => (e.currentTarget.style.background = "#ffffff")}
    >
      {children}
    </div>
  )
}

/* ─── Section header ────────────────────────────── */
function SectionHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: COL6, gap: "0 1rem",
      padding: "0.55rem 1.25rem",
      background: "rgba(12,12,10,0.03)",
      borderBottom: "1px solid rgba(12,12,10,0.07)",
    }}>
      {cols.map((c, i) => (
        <span key={i} style={{
          fontSize: "0.47rem", letterSpacing: "0.22em", color: "#9A9489",
          textTransform: "uppercase", fontWeight: 700,
          textAlign: i === cols.length - 1 ? "right" : "left",
        }}>{c}</span>
      ))}
    </div>
  )
}

/* ─── Send Modal ────────────────────────────────── */
function SendModal({ invoice, onClose, onConfirm, loading }: {
  invoice: FinanceInvoice
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)", padding: "1rem",
    }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: EASE }}
        style={{ background: "#ffffff", borderRadius: "6px", maxWidth: "420px", width: "100%", overflow: "hidden", border: "1px solid rgba(12,12,10,0.07)" }}>
        <div style={{ height: "2px", background: "#3A8E2A" }} />
        <div style={{ padding: "1.75rem 2rem 2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#3A8E2A", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Enviar factura certificada</p>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>{invoice.invoiceNumber}</h2>
            </div>
            <button onClick={onClose} disabled={loading} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9489" }}><X size={16} /></button>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#6B6260", lineHeight: 1.6, marginBottom: "1.75rem" }}>
            Se enviará la factura <strong style={{ color: "#0C0C0A" }}>{invoice.invoiceNumber}</strong> al cliente{" "}
            <strong style={{ color: "#0C0C0A" }}>{invoice.clientName}</strong> y se marcará como ENVIADA.
          </p>
          <div style={{ display: "flex", gap: "10px", paddingTop: "1rem", borderTop: "1px solid rgba(12,12,10,0.07)" }}>
            <button onClick={onClose} disabled={loading} style={{
              flex: 1, padding: "0.65rem", background: "none",
              border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#6B6260", cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={onConfirm} disabled={loading} style={{
              flex: 1, padding: "0.65rem", background: loading ? "rgba(58,142,42,0.4)" : "#3A8E2A",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#ffffff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              <Send size={11} /> {loading ? "Enviando..." : "Confirmar envío"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function FinanceBillingPage() {
  const [search, setSearch] = useState("")
  const [draftInvoices, setDraftInvoices] = useState<FinanceInvoice[]>([])
  const [certifiedInvoices, setCertifiedInvoices] = useState<FinanceInvoice[]>([])
  const [selectedCertified, setSelectedCertified] = useState<FinanceInvoice | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)

  const refreshData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [draft, certified] = await Promise.all([
        fetchFinanceInvoices("BORRADOR"),
        fetchFinanceInvoices("CERTIFICADA"),
      ])
      setDraftInvoices(draft)
      setCertifiedInvoices(certified)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar la bandeja de facturación")
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => { void refreshData() }, [refreshData])

  const sv = normalize(search)
  const filteredDraft = useMemo(() => !sv ? draftInvoices : draftInvoices.filter(inv =>
    `${inv.invoiceNumber} ${inv.orderNumber} ${inv.clientName}`.toLowerCase().includes(sv)
  ), [draftInvoices, sv])
  const filteredCertified = useMemo(() => !sv ? certifiedInvoices : certifiedInvoices.filter(inv =>
    `${inv.invoiceNumber} ${inv.clientName} ${inv.felUuid ?? ""}`.toLowerCase().includes(sv)
  ), [certifiedInvoices, sv])

  const confirmSend = async () => {
    if (!selectedCertified) return
    setSendingInvoice(true)
    try {
      await sendFinanceInvoice(selectedCertified.invoiceId)
      toast.success(`Factura ${selectedCertified.invoiceNumber} enviada al cliente`)
      setSelectedCertified(null)
      await refreshData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible enviar la factura")
    } finally {
      setSendingInvoice(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>BF</div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Módulo Financiero
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Bandeja de Facturación
            </motion.h1>
          </div>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Info strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            background: "#1E1E1B", borderRadius: "4px", padding: "0.85rem 1.25rem",
            marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "10px",
          }}>
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#C9924B", flexShrink: 0 }} />
          <p style={{ fontSize: "0.72rem", color: "#9A9489", lineHeight: 1.5 }}>
            Primero aparecen los <span style={{ color: "#C9924B", fontWeight: 700 }}>BORRADOR</span> generados al entregar la orden,
            luego las facturas <span style={{ color: "#3A8E2A", fontWeight: 700 }}>CERTIFICADAS</span> listas para envío.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ position: "relative", marginBottom: "2rem" }}>
          <Search size={13} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#9A9489" }} />
          <input
            type="text"
            placeholder="Buscar por factura, orden o cliente"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "0.65rem 0.9rem 0.65rem 2.5rem",
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.1)",
              borderRadius: "4px", color: "#0C0C0A", fontSize: "0.82rem", outline: "none",
            }}
            onFocus={e => (e.target.style.borderColor = "#C9924B")}
            onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.1)")}
          />
        </motion.div>

        {/* ── BORRADOR ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#C9924B" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700 }}>
              Borradores · {filteredDraft.length}
            </p>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <SectionHeader cols={["Factura", "Orden", "Cliente", "Fecha Entrega", "Estado", "Acción"]} />

            {loadingData ? (
              <p style={{ padding: "1.5rem", fontSize: "0.75rem", color: "#9A9489", textAlign: "center" }}>Cargando...</p>
            ) : filteredDraft.length === 0 ? (
              <p style={{ padding: "2rem", fontSize: "0.75rem", color: "#9A9489", textAlign: "center" }}>No hay facturas BORRADOR.</p>
            ) : (
              filteredDraft.map(inv => (
                <InvoiceRow key={inv.invoiceId} accent="#C9924B">
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#C9924B" }}>{inv.invoiceNumber}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0C0C0A" }}>{inv.orderNumber}</span>
                  <span style={{ fontSize: "0.78rem", color: "#0C0C0A" }}>{inv.clientName}</span>
                  <span style={{ fontSize: "0.72rem", color: "#9A9489" }}>
                    {inv.deliveredAt ? new Date(inv.deliveredAt).toLocaleDateString("es-GT") : "—"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(201,146,75,0.1)", borderRadius: "3px", padding: "2px 7px" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#C9924B" }} />
                    <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9924B" }}>Borrador</span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <Link href={`/finances/facturacion/${inv.invoiceId}`} style={{ textDecoration: "none" }}>
                      <button style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "0.35rem 0.8rem",
                        background: "none", border: "1px solid rgba(201,146,75,0.3)",
                        borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9924B", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                        onMouseOver={e => (e.currentTarget.style.background = "rgba(201,146,75,0.07)")}
                        onMouseOut={e => (e.currentTarget.style.background = "none")}
                      >
                        <FileSearch size={11} /> Revisar
                      </button>
                    </Link>
                  </div>
                </InvoiceRow>
              ))
            )}
          </div>
        </motion.div>

        {/* ── CERTIFICADAS ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: EASE }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#3A8E2A" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "#3A8E2A", textTransform: "uppercase", fontWeight: 700 }}>
              Certificadas por FEL · {filteredCertified.length}
            </p>
          </div>
          <p style={{ fontSize: "0.72rem", color: "#9A9489", marginBottom: "10px" }}>
            Luego de la aprobación fiscal, quedan listas para envío al cliente.
          </p>

          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>
            <SectionHeader cols={["Factura", "Cliente", "UUID FEL", "Certificada", "Estado", "Acción"]} />

            {loadingData ? (
              <p style={{ padding: "1.5rem", fontSize: "0.75rem", color: "#9A9489", textAlign: "center" }}>Cargando...</p>
            ) : filteredCertified.length === 0 ? (
              <p style={{ padding: "2rem", fontSize: "0.75rem", color: "#9A9489", textAlign: "center" }}>No hay facturas CERTIFICADAS pendientes de envío.</p>
            ) : (
              filteredCertified.map(inv => (
                <InvoiceRow key={inv.invoiceId} accent="#3A8E2A">
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3A8E2A" }}>{inv.invoiceNumber}</span>
                  <span style={{ fontSize: "0.78rem", color: "#0C0C0A" }}>{inv.clientName}</span>
                  <span style={{ fontSize: "0.62rem", fontFamily: "monospace", color: "#9A9489", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {inv.felUuid ?? "—"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#9A9489" }}>
                    {inv.certifiedAt ? new Date(inv.certifiedAt).toLocaleString("es-GT") : "—"}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(58,142,42,0.08)", borderRadius: "3px", padding: "2px 7px" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#3A8E2A" }} />
                    <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3A8E2A" }}>Certificada</span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedCertified(inv)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "0.35rem 0.85rem",
                        background: "#3A8E2A", border: "none",
                        borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseOver={e => (e.currentTarget.style.background = "#2E7321")}
                      onMouseOut={e => (e.currentTarget.style.background = "#3A8E2A")}
                    >
                      <Mail size={11} /> Enviar
                    </button>
                  </div>
                </InvoiceRow>
              ))
            )}
          </div>
        </motion.div>

      </div>

      {selectedCertified && (
        <SendModal
          invoice={selectedCertified}
          onClose={() => !sendingInvoice && setSelectedCertified(null)}
          onConfirm={() => void confirmSend()}
          loading={sendingInvoice}
        />
      )}
    </div>
  )
}
