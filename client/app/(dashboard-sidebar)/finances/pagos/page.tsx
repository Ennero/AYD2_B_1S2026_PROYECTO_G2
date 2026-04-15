"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Search, Wallet, X } from "lucide-react"
import { toast } from "sonner"
import { approveFinancePayment, fetchFinancePayments } from "@/lib/api/finance"
import type { FinancePayment } from "@/types/finance"

const EASE = [0.16, 1, 0.3, 1] as const

function formatCurrency(v: number, currencyCode = "GTQ") {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

const COL5 = "1.4fr 1fr 1fr 1fr 0.8fr"

/* ─── Approve Modal ─────────────────────────────── */
function ApproveModal({ payment, onClose, onConfirm, loading }: {
  payment: FinancePayment
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const fields = [
    { label: "Cliente",     value: payment.clientName },
    { label: "Factura",     value: payment.invoiceNumber },
    { label: "Monto",       value: formatCurrency(payment.amount, payment.currencyCode ?? "GTQ") },
    { label: "Método",      value: payment.method },
  ]

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
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#3A8E2A", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Confirmar aprobación de pago</p>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
                {payment.invoiceNumber}
              </h2>
            </div>
            <button onClick={onClose} disabled={loading} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9489" }}><X size={16} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
            <Wallet size={14} style={{ color: "#6B6260" }} />
            <p style={{ fontSize: "0.72rem", color: "#6B6260" }}>El pago se registrará como <strong style={{ color: "#3A8E2A" }}>APROBADO</strong> en tesorería.</p>
          </div>

          <div style={{
            background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "4px", padding: "1rem 1.1rem", marginBottom: "1.5rem",
            display: "flex", flexDirection: "column", gap: "6px",
          }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>{f.label}</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0C0C0A" }}>{f.value}</span>
              </div>
            ))}
            <div style={{ paddingTop: "6px", borderTop: "1px solid rgba(12,12,10,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.6rem", letterSpacing: "0.12em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Estado actual</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(201,146,75,0.1)", borderRadius: "3px", padding: "2px 7px" }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#C9924B" }} />
                <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C9924B" }}>Pendiente</span>
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} disabled={loading} style={{
              flex: 1, padding: "0.65rem", background: "none",
              border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#6B6260", cursor: "pointer",
            }}>Cancelar</button>
            <button onClick={onConfirm} disabled={loading} style={{
              flex: 1, padding: "0.65rem",
              background: loading ? "rgba(58,142,42,0.4)" : "#3A8E2A",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#ffffff", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              <CheckCircle2 size={11} /> {loading ? "Aprobando..." : "Confirmar aprobación"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function FinancePaymentsPage() {
  const [search, setSearch] = useState("")
  const [pendingPayments, setPendingPayments] = useState<FinancePayment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<FinancePayment | null>(null)
  const [approving, setApproving] = useState(false)

  const refreshPendingPayments = async () => {
    setLoadingPayments(true)
    try {
      const payments = await fetchFinancePayments("PENDIENTE")
      setPendingPayments(payments)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar los pagos pendientes")
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => { void refreshPendingPayments() }, [])

  const filteredPayments = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return pendingPayments
    return pendingPayments.filter(p =>
      `${p.clientName} ${p.invoiceNumber}`.toLowerCase().includes(needle)
    )
  }, [pendingPayments, search])

  const confirmApprove = async () => {
    if (!selectedPayment) return
    setApproving(true)
    try {
      await approveFinancePayment(selectedPayment.paymentId)
      toast.success(`Pago #${selectedPayment.paymentId} aprobado`)
      setSelectedPayment(null)
      await refreshPendingPayments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible aprobar el pago")
    } finally {
      setApproving(false)
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
      }}>CP</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

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
              Conciliar Pagos
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "50ch" }}>
            Autorización de pagos registrados para liberar crédito a clientes.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Info strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            background: "rgba(201,146,75,0.06)", border: "1px solid rgba(201,146,75,0.2)",
            borderLeft: "3px solid #C9924B", borderRadius: "4px",
            padding: "0.85rem 1.25rem", marginBottom: "1.5rem",
            display: "flex", alignItems: "flex-start", gap: "10px",
          }}>
          <Wallet size={13} style={{ color: "#C9924B", flexShrink: 0, marginTop: "1px" }} />
          <p style={{ fontSize: "0.72rem", color: "#6B6260", lineHeight: 1.5 }}>
            Esta aprobación ocurre <strong style={{ color: "#0C0C0A" }}>después de certificar FEL</strong> y
            habilita el envío de la factura al cliente, además de liberar crédito.
          </p>
        </motion.div>

        {/* Search + count */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#9A9489" }} />
            <input
              type="text"
              placeholder="Buscar por cliente, factura o referencia bancaria"
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
          </div>
          {filteredPayments.length > 0 && (
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, flexShrink: 0 }}>
              {filteredPayments.length} pago{filteredPayments.length !== 1 ? "s" : ""} · Acción requerida
            </span>
          )}
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: EASE }}>
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", overflow: "hidden" }}>

            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: COL5, gap: "0 1rem",
              padding: "0.55rem 1.25rem",
              background: "rgba(12,12,10,0.03)", borderBottom: "1px solid rgba(12,12,10,0.07)",
            }}>
              {["Cliente", "Factura", "Monto", "Método", "Acción"].map((h, i) => (
                <span key={h} style={{
                  fontSize: "0.47rem", letterSpacing: "0.22em", color: "#9A9489",
                  textTransform: "uppercase", fontWeight: 700,
                  textAlign: i === 4 ? "right" : "left",
                }}>{h}</span>
              ))}
            </div>

            {loadingPayments ? (
              <p style={{ padding: "2rem", fontSize: "0.75rem", color: "#9A9489", textAlign: "center" }}>Cargando pagos pendientes...</p>
            ) : filteredPayments.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center" }}>
                <CheckCircle2 size={28} style={{ color: "#9A9489", margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Sin pendientes</p>
                <p style={{ fontSize: "0.78rem", color: "#6B6260" }}>No hay pagos pendientes por conciliar.</p>
              </div>
            ) : (
              filteredPayments.map(payment => (
                <div key={payment.paymentId} style={{
                  display: "grid", gridTemplateColumns: COL5, gap: "0 1rem",
                  alignItems: "center", padding: "0.85rem 1.25rem",
                  background: "#ffffff", borderBottom: "1px solid rgba(12,12,10,0.06)",
                  borderLeft: "3px solid #C9924B",
                  transition: "background 0.12s",
                }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.01)")}
                  onMouseOut={e => (e.currentTarget.style.background = "#ffffff")}
                >
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0C0C0A" }}>{payment.clientName}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#C9924B" }}>{payment.invoiceNumber}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 900, color: "#0C0C0A", letterSpacing: "-0.01em" }}>
                    {formatCurrency(payment.amount, payment.currencyCode ?? "GTQ")}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#9A9489", textTransform: "uppercase", letterSpacing: "0.05em" }}>{payment.method}</span>
                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => setSelectedPayment(payment)} style={{
                      display: "inline-flex", alignItems: "center", gap: "5px",
                      padding: "0.35rem 0.85rem",
                      background: "#3A8E2A", border: "none", borderRadius: "3px",
                      fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                      onMouseOver={e => (e.currentTarget.style.background = "#2E7321")}
                      onMouseOut={e => (e.currentTarget.style.background = "#3A8E2A")}
                    >
                      <CheckCircle2 size={11} /> Aprobar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>

      {selectedPayment && (
        <ApproveModal
          payment={selectedPayment}
          onClose={() => !approving && setSelectedPayment(null)}
          onConfirm={() => void confirmApprove()}
          loading={approving}
        />
      )}
    </div>
  )
}
