"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { Invoice } from "@/lib/api/types"
import { toast } from "sonner"
import { Check, X, FileText, AlertTriangle, ShieldCheck } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

function formatQ(amount: number | string) {
  return Number(amount).toLocaleString("es-GT", { minimumFractionDigits: 2 })
}

/* ─── Certify Modal ──────────────────────────────────────── */
function CertifyModal({
  invoice,
  onClose,
  onDone,
}: {
  invoice: Invoice
  onClose: () => void
  onDone: () => void
}) {
  const [nitToValidate, setNitToValidate] = useState(invoice.clientNit ?? "")
  const [nitIsValid, setNitIsValid]       = useState(false)
  const [nitValidatedForId, setNitValidatedForId] = useState<string | null>(null)
  const [isValidatingNit, setIsValidatingNit] = useState(false)
  const [isProcessing, setIsProcessing]   = useState(false)

  const canCertify = nitIsValid && nitValidatedForId === invoice.invoiceId

  async function validateNit() {
    const val = nitToValidate.trim()
    if (!val) { toast.error("Debe ingresar un NIT para validar"); return }
    setIsValidatingNit(true)
    try {
      const res = await api.post<{ data: { invoiceId: string; clientNit: string; isValid: boolean } }>(
        ENDPOINTS.CERTIFIER.VALIDATE_NIT(invoice.invoiceId),
        { clientNit: val },
      )
      const isValid = res.data.data.isValid
      setNitIsValid(isValid)
      setNitValidatedForId(isValid ? invoice.invoiceId : null)
      if (isValid) toast.success("NIT validado correctamente")
      else toast.error("El NIT no coincide con el receptor de la factura")
    } catch {
      setNitIsValid(false); setNitValidatedForId(null)
    } finally { setIsValidatingNit(false) }
  }

  async function handleCertify() {
    if (!canCertify) { toast.error("Primero valide el NIT del receptor"); return }
    setIsProcessing(true)
    try {
      const pseudoFelUuid = crypto.randomUUID().toUpperCase()
      await api.patch(ENDPOINTS.CERTIFIER.CERTIFY(invoice.invoiceId), {
        felUuid: pseudoFelUuid,
        clientNit: nitToValidate.trim(),
      })
      toast.success(`Factura ${invoice.invoiceNumber} certificada con éxito`)
      onDone()
    } catch { /* api client shows toast */ }
    finally { setIsProcessing(false) }
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "0.65rem 0.85rem",
    background: "#F5F2EC", border: `1px solid ${nitIsValid ? "rgba(58,142,42,0.4)" : "rgba(12,12,10,0.12)"}`,
    borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem", outline: "none",
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)", padding: "1rem",
    }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{
          background: "#ffffff", borderRadius: "6px",
          maxWidth: "480px", width: "100%",
          border: "1px solid rgba(12,12,10,0.07)", overflow: "hidden",
        }}>
        <div style={{ height: "2px", background: "#3A8E2A" }} />
        <div style={{ padding: "1.75rem 2rem 2rem" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#3A8E2A", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                Certificar documento
              </p>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A" }}>
                {invoice.invoiceNumber}
              </h2>
              <p style={{ fontSize: "0.72rem", color: "#9A9489", marginTop: "2px" }}>
                {invoice.clientName} · {invoice.currency || "GTQ"} {formatQ(invoice.totalAmount)}
              </p>
            </div>
            <button onClick={onClose} disabled={isProcessing}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9489" }}>
              <X size={18} />
            </button>
          </div>

          {/* Success icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(58,142,42,0.08)", border: "1px solid rgba(58,142,42,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={22} style={{ color: "#3A8E2A" }} />
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "#6B6260", textAlign: "center", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            Se generará un UUID de FEL y el documento será válido ante la SAT de forma inmediata.
          </p>

          <div style={{ height: "1px", background: "rgba(12,12,10,0.07)", marginBottom: "1.5rem" }} />

          {/* NIT validation */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
              Validación de NIT (simulada)
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                style={inputStyle}
                placeholder="Ingrese NIT a validar"
                value={nitToValidate}
                onChange={(e) => { setNitToValidate(e.target.value); setNitIsValid(false); setNitValidatedForId(null) }}
                disabled={isProcessing}
              />
              <button
                onClick={validateNit}
                disabled={isValidatingNit || isProcessing || !nitToValidate.trim()}
                style={{
                  padding: "0 1.1rem", flexShrink: 0,
                  background: "none", border: "1px solid rgba(12,12,10,0.15)",
                  borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "#6B6260", cursor: "pointer",
                  opacity: (isValidatingNit || isProcessing || !nitToValidate.trim()) ? 0.5 : 1,
                  whiteSpace: "nowrap",
                }}
              >
                {isValidatingNit ? "Verificando..." : "Verificar NIT"}
              </button>
            </div>
            <p style={{ fontSize: "0.68rem", marginTop: "6px", color: nitIsValid ? "#3A8E2A" : "#9A9489", fontWeight: nitIsValid ? 700 : 400 }}>
              {nitIsValid
                ? "✓ NIT validado. Ya puede certificar este documento."
                : "Debe validar el NIT correctamente antes de certificar."}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "1rem", borderTop: "1px solid rgba(12,12,10,0.07)" }}>
            <button onClick={onClose} disabled={isProcessing} style={{
              flex: 1, padding: "0.65rem",
              background: "none", border: "1px solid rgba(12,12,10,0.12)",
              borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#6B6260", cursor: "pointer",
            }}>
              Cancelar
            </button>
            <button onClick={handleCertify} disabled={!canCertify || isProcessing} style={{
              flex: 1, padding: "0.65rem",
              background: (!canCertify || isProcessing) ? "rgba(58,142,42,0.3)" : "#3A8E2A",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#ffffff",
              cursor: (!canCertify || isProcessing) ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}>
              {isProcessing ? "Certificando..." : "Confirmar y Certificar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Reject Modal ───────────────────────────────────────── */
function RejectModal({
  invoice,
  onClose,
  onDone,
}: {
  invoice: Invoice
  onClose: () => void
  onDone: () => void
}) {
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error("Debe proporcionar un motivo de rechazo"); return }
    setIsProcessing(true)
    try {
      await api.patch(ENDPOINTS.CERTIFIER.REJECT(invoice.invoiceId), { reason: rejectReason })
      toast.success(`Documento ${invoice.invoiceNumber} rechazado correctamente`)
      onDone()
    } catch { /* api client shows toast */ }
    finally { setIsProcessing(false) }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)", padding: "1rem",
    }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{
          background: "#ffffff", borderRadius: "6px",
          maxWidth: "460px", width: "100%",
          border: "1px solid rgba(12,12,10,0.07)", overflow: "hidden",
        }}>
        <div style={{ height: "2px", background: "#E53E3E" }} />
        <div style={{ padding: "1.75rem 2rem 2rem" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#E53E3E", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                Rechazar documento
              </p>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#0C0C0A" }}>
                {invoice.invoiceNumber}
              </h2>
            </div>
            <button onClick={onClose} disabled={isProcessing}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9A9489" }}>
              <X size={18} />
            </button>
          </div>

          {/* Warning */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            background: "rgba(229,62,62,0.05)", border: "1px solid rgba(229,62,62,0.15)",
            borderRadius: "4px", padding: "0.85rem 1rem", marginBottom: "1.5rem",
          }}>
            <AlertTriangle size={15} style={{ color: "#E53E3E", flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "0.75rem", color: "#E53E3E", fontWeight: 600, lineHeight: 1.5 }}>
              Esta acción invalidará el documento y lo devolverá al flujo operativo de revisión.
            </p>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.5rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "8px" }}>
              Motivo de rechazo (obligatorio)
            </label>
            <textarea
              style={{
                width: "100%", minHeight: "110px",
                padding: "0.75rem 0.85rem",
                background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.12)",
                borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem",
                outline: "none", resize: "vertical", boxSizing: "border-box",
                lineHeight: 1.5,
              }}
              placeholder="Ej. NIT inválido, montos no coinciden con la orden de servicio..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = "#E53E3E")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(12,12,10,0.12)")}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "1rem", borderTop: "1px solid rgba(12,12,10,0.07)" }}>
            <button onClick={onClose} disabled={isProcessing} style={{
              flex: 1, padding: "0.65rem",
              background: "none", border: "1px solid rgba(12,12,10,0.12)",
              borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#6B6260", cursor: "pointer",
            }}>
              Cancelar
            </button>
            <button onClick={handleReject} disabled={isProcessing} style={{
              flex: 1, padding: "0.65rem",
              background: isProcessing ? "rgba(229,62,62,0.4)" : "#E53E3E",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#ffffff",
              cursor: isProcessing ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}>
              {isProcessing ? "Rechazando..." : "Rechazar Documento"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════════ */
export default function BandejaAprobacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [certifyTarget, setCertifyTarget] = useState<Invoice | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<Invoice | null>(null)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ data: Invoice[] }>(ENDPOINTS.CERTIFIER.INVOICES)
      setInvoices(response.data.data)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInvoices() }, [])

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Ghost letters */}
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem, 30vw, 28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>BA</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Certificador FEL
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Bandeja de Aprobación
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "48ch" }}>
            Revisión y certificación de Documentos Tributarios Electrónicos (DTE).
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Count */}
        {!loading && invoices.length > 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
            {invoices.length} documento{invoices.length !== 1 ? "s" : ""} pendiente{invoices.length !== 1 ? "s" : ""}
          </motion.p>
        )}

        {/* Table header */}
        {!loading && invoices.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1.2fr 1fr auto",
            gap: "0 1rem", padding: "0 1.25rem 0.6rem",
            borderBottom: "1px solid rgba(12,12,10,0.1)", marginBottom: "8px",
          }}>
            {["Documento", "Cliente", "NIT", "Monto (GTQ)", "Acciones"].map((h, i) => (
              <span key={h} style={{ fontSize: "0.48rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, textAlign: i === 4 ? "right" : "left" }}>
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Cargando documentos...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && invoices.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <FileText size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem" }}>
              Bandeja vacía
            </p>
            <p style={{ fontSize: "0.8rem", color: "#6B6260" }}>
              No hay documentos pendientes de aprobación.
            </p>
          </div>
        )}

        {/* Invoice rows */}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <AnimatePresence>
              {invoices.map((inv, i) => {
                const emissionDate =
                  inv.issueDate ||
                  (inv as Invoice & { issue_date?: string }).issue_date ||
                  null

                return (
                  <motion.div key={inv.invoiceId}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.04, duration: 0.35, ease: EASE }}
                    style={{
                      display: "grid", gridTemplateColumns: "1.2fr 1.8fr 1.2fr 1fr auto",
                      gap: "0 1rem", alignItems: "center",
                      background: "#ffffff",
                      border: "1px solid rgba(12,12,10,0.07)",
                      borderLeft: "3px solid #C9924B",
                      borderRadius: "4px", padding: "0.9rem 1.25rem",
                      transition: "box-shadow 0.15s, transform 0.15s",
                    }}
                    onMouseOver={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.boxShadow = "0 4px 16px rgba(12,12,10,0.06)"
                      el.style.transform = "translateY(-1px)"
                    }}
                    onMouseOut={e => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.boxShadow = "none"
                      el.style.transform = "translateY(0)"
                    }}
                  >
                    {/* Documento */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "3px", flexShrink: 0,
                        background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <FileText size={14} style={{ color: "#C9924B" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#C9924B", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {inv.invoiceNumber}
                        </p>
                        <p style={{ fontSize: "0.62rem", color: "#9A9489" }}>
                          {emissionDate ? new Date(emissionDate).toLocaleDateString("es-GT") : "Sin fecha"}
                        </p>
                      </div>
                    </div>

                    {/* Cliente */}
                    <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {inv.clientName}
                    </p>

                    {/* NIT */}
                    <p style={{ fontSize: "0.72rem", color: "#6B6260", fontFamily: "monospace" }}>
                      {inv.clientNit}
                    </p>

                    {/* Monto */}
                    <p style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0C0C0A", letterSpacing: "-0.01em" }}>
                      {inv.currency || "GTQ"} {formatQ(inv.totalAmount)}
                    </p>

                    {/* Acciones */}
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexShrink: 0 }}>
                      <button
                        onClick={() => setRejectTarget(inv)}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "0.4rem 0.75rem",
                          background: "none", border: "1px solid rgba(229,62,62,0.25)",
                          borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: "#E53E3E", cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s",
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = "rgba(229,62,62,0.06)"; e.currentTarget.style.borderColor = "#E53E3E" }}
                        onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(229,62,62,0.25)" }}
                      >
                        <X size={11} /> Rechazar
                      </button>
                      <button
                        onClick={() => setCertifyTarget(inv)}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "0.4rem 0.85rem",
                          background: "#3A8E2A", border: "none",
                          borderRadius: "3px", fontSize: "0.55rem", fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: "#ffffff", cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = "#2E7321")}
                        onMouseOut={e => (e.currentTarget.style.background = "#3A8E2A")}
                      >
                        <Check size={11} /> Certificar
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* Modals */}
      {certifyTarget && (
        <CertifyModal
          invoice={certifyTarget}
          onClose={() => setCertifyTarget(null)}
          onDone={async () => { setCertifyTarget(null); await fetchInvoices() }}
        />
      )}
      {rejectTarget && (
        <RejectModal
          invoice={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={async () => { setRejectTarget(null); await fetchInvoices() }}
        />
      )}
    </div>
  )
}
