"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, FileCheck2, FileText, Send, X } from "lucide-react"
import { toast } from "sonner"
import { fetchFinanceInvoiceById, submitFinanceInvoiceForCertification } from "@/lib/api/finance"
import type { FinanceInvoice } from "@/types/finance"

const EASE = [0.16, 1, 0.3, 1] as const

function formatAmount(value: number, currencyCode = "GTQ"): string {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/* ─── FEL Confirm Modal ──────────────────────────────────────────────────── */

function FelModal({
  open,
  invoice,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean
  invoice: FinanceInvoice | null
  submitting: boolean
  onClose: () => void
  onConfirm: (description: string, dueDate: string) => void
}) {
  const [descriptionInput, setDescriptionInput] = useState("")
  const [dueDateInput, setDueDateInput] = useState("")

  useEffect(() => {
    if (open && invoice) {
      setDescriptionInput(invoice.serviceDescription || "")
      setDueDateInput(
        invoice.dueDate
          ? new Date(invoice.dueDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      )
    }
  }, [open, invoice])

  if (!open || !invoice) return null

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      }}
      onClick={() => { if (!submitting) onClose() }}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: "6px",
          width: "100%", maxWidth: "480px", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(12,12,10,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: "3px", background: "#C9924B" }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileCheck2 size={15} style={{ color: "#C9924B" }} />
            <h2 style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
              Confirmar envío a FEL
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              width: "30px", height: "30px", borderRadius: "4px", display: "flex",
              alignItems: "center", justifyContent: "center", background: "rgba(12,12,10,0.04)",
              border: "1px solid rgba(12,12,10,0.08)", color: "#9A9489", cursor: "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.08)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ fontSize: "0.82rem", color: "#6B6260", lineHeight: 1.6 }}>
            Factura: <strong style={{ color: "#0C0C0A" }}>{invoice.invoiceNumber}</strong><br />
            Cliente: <strong style={{ color: "#0C0C0A" }}>{invoice.clientName}</strong>
          </p>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "0.4rem", letterSpacing: "0.01em" }}>
              Concepto / Descripción servicio
            </label>
            <textarea
              rows={3}
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="Ej. Servicios de transporte de carga..."
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.6rem 0.75rem", borderRadius: "4px",
                border: "1px solid rgba(12,12,10,0.15)", background: "#F5F2EC",
                fontSize: "0.82rem", color: "#0C0C0A", outline: "none", resize: "none",
                fontFamily: "inherit",
              }}
              onFocus={e => (e.target.style.borderColor = "#C9924B")}
              onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.15)")}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "0.4rem", letterSpacing: "0.01em" }}>
              Fecha de vencimiento
            </label>
            <input
              type="date"
              value={dueDateInput}
              onChange={(e) => setDueDateInput(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.6rem 0.75rem", borderRadius: "4px",
                border: "1px solid rgba(12,12,10,0.15)", background: "#F5F2EC",
                fontSize: "0.82rem", color: "#0C0C0A", outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = "#C9924B")}
              onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.15)")}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
            <button
              onClick={() => onConfirm(descriptionInput, dueDateInput)}
              disabled={submitting}
              style={{
                flex: 1, padding: "0.6rem 1rem",
                background: submitting ? "rgba(201,146,75,0.5)" : "#C9924B",
                border: "none", borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff",
                cursor: submitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                transition: "background 0.15s",
              }}
              onMouseOver={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#b5833f" }}
              onMouseOut={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#C9924B" }}
            >
              {submitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Enviando…
                </>
              ) : (
                <><Send size={12} /> Confirmar envío</>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: "0.6rem 1.25rem", background: "transparent",
                border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6B6260",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "rgba(12,12,10,0.04)")}
              onMouseOut={e => (e.currentTarget.style.background = "transparent")}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function FinanceInvoiceReviewPage() {
  const params = useParams<{ invoiceId: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<FinanceInvoice | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadInvoice = async () => {
      if (!params.invoiceId) { setLoadingInvoice(false); return }
      try {
        const current = await fetchFinanceInvoiceById(params.invoiceId)
        setInvoice(current)
      } catch (error) {
        const message = error instanceof Error ? error.message : "No fue posible cargar el detalle de factura"
        toast.error(message)
      } finally {
        setLoadingInvoice(false)
      }
    }
    void loadInvoice()
  }, [params.invoiceId])

  const handleSubmitForCertification = async (description: string, dueDate: string) => {
    if (!invoice) return
    setSubmitting(true)
    try {
      await submitFinanceInvoiceForCertification(invoice.invoiceId, {
        serviceDescription: description,
        dueDate: new Date(dueDate).toISOString(),
        reviewConfirmed: true,
      })
      toast.success(`Factura ${invoice.invoiceNumber} enviada al flujo FEL`)
      setShowSubmitModal(false)
      router.push("/finances/facturacion")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible enviar la factura"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Loading ── */
  if (loadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F2EC" }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.24em", color: "#9A9489", textTransform: "uppercase" }}>
          Cargando factura…
        </p>
      </div>
    )
  }

  /* ── Not found ── */
  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#F5F2EC" }}>
        <FileText size={32} style={{ color: "#9A9489" }} />
        <p style={{ fontSize: "0.82rem", color: "#6B6260" }}>No se encontró la factura solicitada.</p>
        <button
          onClick={() => router.push("/finances/facturacion")}
          style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", padding: "0.5rem 1.5rem",
            background: "#0C0C0A", color: "#F5F2EC", borderRadius: "4px", cursor: "pointer",
          }}
        >
          Volver a bandeja
        </button>
      </div>
    )
  }

  return (
    <>
      <FelModal
        open={showSubmitModal}
        invoice={invoice}
        submitting={submitting}
        onClose={() => { if (!submitting) setShowSubmitModal(false) }}
        onConfirm={(desc, due) => void handleSubmitForCertification(desc, due)}
      />

      <div className="min-h-screen" style={{ background: "#F5F2EC" }}>

        {/* Grid overlay */}
        <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
          backgroundSize: "72px 72px",
        }} />
        <div aria-hidden style={{
          position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
          fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
          color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}>CK</div>

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-14">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

            <button
              onClick={() => router.push("/finances/facturacion")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                fontSize: "0.62rem", letterSpacing: "0.1em", color: "#9A9489",
                textTransform: "uppercase", fontWeight: 600, marginBottom: "1.5rem",
                cursor: "pointer", background: "none", border: "none", padding: 0,
              }}
              onMouseOver={e => (e.currentTarget.style.color = "#0C0C0A")}
              onMouseOut={e => (e.currentTarget.style.color = "#9A9489")}
            >
              <ArrowLeft size={14} /> Bandeja de facturas
            </button>

            <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
              Finanzas · Facturación
            </p>
            <div style={{ overflow: "hidden" }}>
              <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
                transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
                style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
                Revisión de Factura
              </motion.h1>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem" }}>
              {invoice.invoiceNumber} · Orden {invoice.orderNumber}
            </motion.p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
              style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
          </motion.div>

          {/* ── Info banner ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            style={{
              background: "rgba(201,146,75,0.07)", border: "1px solid rgba(201,146,75,0.2)",
              borderRadius: "6px", padding: "0.9rem 1.25rem", marginBottom: "1.25rem",
              fontSize: "0.78rem", color: "#6B6260", lineHeight: 1.7,
            }}>
            Este borrador se generó automáticamente cuando la orden fue marcada como{" "}
            <strong style={{ color: "#0C0C0A" }}>ENTREGADA</strong>. Finanzas valida datos
            comerciales y tributarios antes de enviarlo al certificador FEL.
          </motion.div>

          {/* ── Invoice card ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", overflow: "hidden",
            }}>

            <div style={{ height: "3px", background: "#C9924B" }} />

            {/* Document header */}
            <div style={{
              padding: "1.5rem 1.75rem",
              borderBottom: "1px solid rgba(12,12,10,0.07)",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: "1rem", flexWrap: "wrap",
            }}>
              <div>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.35rem" }}>
                  Documento
                </p>
                <p style={{ fontSize: "clamp(1.3rem,2.5vw,1.9rem)", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A", lineHeight: 1 }}>
                  {invoice.invoiceNumber}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#9A9489", marginTop: "0.4rem" }}>
                  Emitida: {new Date(invoice.issueDate).toLocaleString("es-GT")}
                </p>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.35rem 0.85rem", borderRadius: "4px",
                background: "rgba(201,146,75,0.1)", border: "1px solid rgba(201,146,75,0.25)",
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "#C9924B",
              }}>
                Borrador
              </div>
            </div>

            {/* Two-column content */}
            <div style={{ padding: "1.75rem", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "2rem" }}>

              {/* Receptor */}
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
                  Datos del receptor
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { label: "Cliente", value: invoice.clientName },
                    { label: "NIT", value: invoice.clientNit },
                    { label: "Dirección fiscal", value: invoice.clientAddress || "—" },
                    {
                      label: "Fecha entrega orden",
                      value: invoice.deliveredAt ? new Date(invoice.deliveredAt).toLocaleString("es-GT") : "—",
                    },
                  ].map(item => (
                    <div key={item.label}>
                      <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "3px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0C0C0A" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div>
                <p style={{ fontSize: "0.55rem", letterSpacing: "0.3em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
                  Concepto y totales
                </p>

                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "3px" }}>
                    Descripción servicio
                  </p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0C0C0A" }}>
                    {invoice.serviceDescription || "—"}
                  </p>
                </div>

                <div style={{ background: "#0C0C0A", borderRadius: "6px", padding: "1.25rem 1.5rem" }}>
                  {[
                    { label: "Subtotal", value: formatAmount(invoice.subtotalAmount, invoice.currencyCode ?? "GTQ") },
                    {
                      label: `Impuesto (${((invoice.taxRate ?? 0.12) * 100).toFixed(0)}%)`,
                      value: formatAmount(invoice.taxAmount, invoice.currencyCode ?? "GTQ"),
                    },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <span style={{ fontSize: "0.78rem", color: "rgba(245,242,236,0.55)" }}>{row.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F5F2EC" }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ height: "1px", background: "rgba(245,242,236,0.1)", margin: "0.75rem 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F5F2EC" }}>Total</span>
                    <span style={{ fontSize: "1rem", fontWeight: 900, color: "#C9924B", letterSpacing: "-0.01em" }}>
                      {formatAmount(invoice.totalAmount, invoice.currencyCode ?? "GTQ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA footer */}
            <div style={{
              padding: "1.25rem 1.75rem",
              borderTop: "1px solid rgba(12,12,10,0.07)",
              display: "flex", justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowSubmitModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "0.6rem 1.25rem", background: "#C9924B", border: "none",
                  borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseOver={e => (e.currentTarget.style.background = "#b5833f")}
                onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}
              >
                <Send size={12} /> Enviar a certificador FEL
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  )
}
