"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import type { OrdenDetalle, UnitBinomial, AssignOrderPayload, ContractRouteInfo } from "@/types/logistics"
import type { PageProps } from "@/types"
import {
  ArrowLeft, MapPin, Package, Weight, User, Phone, Mail, Home,
  Truck, CheckCircle, X, Calendar, AlertTriangle, Clock,
} from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

// ── Status config ─────────────────────────────────────────────
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  REGISTRADA:          { label: "Registrada",         color: "#9A9489", bg: "rgba(154,148,137,0.1)" },
  ASIGNADA:            { label: "Asignada",           color: "#C9924B", bg: "rgba(201,146,75,0.1)" },
  LISTA_PARA_DESPACHO: { label: "Lista p/ Despacho",  color: "#C9924B", bg: "rgba(201,146,75,0.12)" },
  EN_TRANSITO:         { label: "En Tránsito",        color: "#3A8E2A", bg: "rgba(58,142,42,0.1)" },
  ENTREGADA:           { label: "Entregada",          color: "#3A8E2A", bg: "rgba(58,142,42,0.08)" },
  BLOQUEADA:           { label: "Bloqueada",          color: "#E53E3E", bg: "rgba(229,62,62,0.1)" },
  CANCELADA:           { label: "Cancelada",          color: "#6B6260", bg: "rgba(107,98,96,0.08)" },
}

// ── Detail field ──────────────────────────────────────────────
function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{ marginTop: "2px", color: "#9A9489", flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: "0.5rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
          {label}
        </p>
        <p style={{ fontSize: "0.82rem", color: "#0C0C0A", fontWeight: 600 }}>{value || "—"}</p>
      </div>
    </div>
  )
}

// ── Modal de Asignación ───────────────────────────────────────
function ModalAsignacion({
  orden,
  onClose,
  onSuccess,
}: {
  orden: OrdenDetalle
  onClose: () => void
  onSuccess: () => void
}) {
  const [binomials, setBinomials] = useState<UnitBinomial[]>([])
  const [loadingBinomials, setLoadingBinomials] = useState(true)
  const [selectedBinomialId, setSelectedBinomialId] = useState("")
  const [selectedRouteId, setSelectedRouteId] = useState("")
  const [scheduledDeparture, setScheduledDeparture] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api
      .get<{ data: UnitBinomial[] }>(`${ENDPOINTS.LOGISTICS.UNIT_BINOMIALS}?orderId=${orden.orderId}`)
      .then(({ data }) => setBinomials(data.data))
      .catch(() => setBinomials([]))
      .finally(() => setLoadingBinomials(false))
  }, [orden.orderId])

  async function handleAsignar() {
    if (!selectedBinomialId || !selectedRouteId || !scheduledDeparture) {
      setError("Completa todos los campos para continuar.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const payload: AssignOrderPayload = {
        contractRouteId: selectedRouteId,
        binomialId: selectedBinomialId,
        scheduledDeparture,
      }
      await api.patch(ENDPOINTS.LOGISTICS.ASSIGN_ORDER(orden.orderId), payload)
      setSuccess(true)
    } catch {
      setError("No se pudo realizar la asignación. Verifica los datos e intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.85rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.82rem",
    outline: "none", cursor: "pointer",
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.85rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px", color: "#F5F2EC", fontSize: "0.82rem",
    outline: "none", colorScheme: "dark",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.5rem", letterSpacing: "0.22em", color: "#9A9489",
    textTransform: "uppercase", fontWeight: 700, marginBottom: "6px",
  }

  if (success) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
        padding: "1rem",
      }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{
            background: "#1E1E1B", borderRadius: "6px",
            padding: "3rem 2.5rem", maxWidth: "420px", width: "100%",
            textAlign: "center", border: "1px solid rgba(255,255,255,0.07)",
          }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            background: "rgba(58,142,42,0.12)", border: "1px solid rgba(58,142,42,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}>
            <CheckCircle size={26} style={{ color: "#3A8E2A" }} />
          </div>

          <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
            Asignación exitosa
          </p>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.03em", color: "#F5F2EC", marginBottom: "0.5rem" }}>
            Orden {orden.orderNumber}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "#9A9489", marginBottom: "2.5rem" }}>
            La orden ha sido asignada correctamente.
          </p>
          <button
            onClick={onSuccess}
            style={{
              width: "100%", padding: "0.75rem",
              background: "#C9924B", border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
            }}
          >
            Volver a órdenes
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(12,12,10,0.6)", backdropFilter: "blur(4px)",
      padding: "1rem",
    }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        style={{
          background: "#1E1E1B", borderRadius: "6px",
          padding: "2rem 2rem 2rem",
          maxWidth: "500px", width: "100%",
          border: "1px solid rgba(255,255,255,0.07)",
          maxHeight: "90vh", overflowY: "auto",
        }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
              Asignar binomio
            </p>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.025em", color: "#F5F2EC" }}>
              {orden.orderNumber}
            </h2>
            <p style={{ fontSize: "0.72rem", color: "#9A9489", marginTop: "2px" }}>
              {orden.origin} → {orden.destination} · {orden.declaredWeightTon}T
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9A9489", padding: "4px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", marginBottom: "1.5rem" }} />

        {/* Ruta del contrato */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Ruta del Contrato</label>
          {orden.contractRoutes.length === 0 ? (
            <p style={{ fontSize: "0.78rem", color: "#E53E3E" }}>Este contrato no tiene rutas configuradas.</p>
          ) : (
            <select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} style={selectStyle}>
              <option value="" style={{ background: "#1E1E1B" }}>Selecciona una ruta...</option>
              {orden.contractRoutes.map((cr: ContractRouteInfo) => (
                <option key={cr.contractRouteId} value={cr.contractRouteId} style={{ background: "#1E1E1B" }}>
                  {cr.origin} → {cr.destination} ({cr.estimatedHours}h estimadas)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Binomio */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Binomio (Vehículo + Piloto)</label>
          {loadingBinomials ? (
            <p style={{ fontSize: "0.78rem", color: "#9A9489" }}>Cargando unidades disponibles...</p>
          ) : binomials.length === 0 ? (
            <p style={{ fontSize: "0.78rem", color: "#E53E3E" }}>No hay unidades disponibles para esta orden.</p>
          ) : (
            <select value={selectedBinomialId} onChange={(e) => setSelectedBinomialId(e.target.value)} style={selectStyle}>
              <option value="" style={{ background: "#1E1E1B" }}>Selecciona un binomio...</option>
              {binomials.map((b) => (
                <option key={b.binomialId} value={b.binomialId} style={{ background: "#1E1E1B" }}>
                  {b.plate} — {b.vehicleType} ({b.capacityTon}T) — Piloto: {b.pilotName}
                  {b.hasRefrigeration ? " ❄" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Salida programada */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Fecha y Hora de Salida Programada</label>
          <input
            type="datetime-local"
            value={scheduledDeparture}
            onChange={(e) => setScheduledDeparture(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(229,62,62,0.08)", border: "1px solid rgba(229,62,62,0.2)",
            borderRadius: "4px", padding: "0.65rem 0.85rem",
            fontSize: "0.78rem", color: "#E53E3E", marginBottom: "1.25rem",
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "0.65rem",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#9A9489", cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={submitting}
            style={{
              flex: 1, padding: "0.65rem",
              background: submitting ? "rgba(201,146,75,0.4)" : "#C9924B",
              border: "none", borderRadius: "4px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#ffffff",
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {submitting ? "Asignando..." : "Confirmar asignación"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function OrdenDetallePage({ params }: PageProps<{ id: string }>) {
  const { id } = use(params)
  const router = useRouter()

  const [orden, setOrden] = useState<OrdenDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    api
      .get<{ data: OrdenDetalle }>(ENDPOINTS.LOGISTICS.ORDER_DETAIL(id))
      .then(({ data }) => setOrden(data.data))
      .catch(() => setOrden(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#F5F2EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
          Cargando detalle...
        </p>
      </div>
    )
  }

  if (!orden) {
    return (
      <div className="min-h-screen" style={{ background: "#F5F2EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
            Orden no encontrada
          </p>
          <button
            onClick={() => router.push("/agente-logistico/ordenes")}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#C9924B", background: "none", border: "none", cursor: "pointer", margin: "0 auto" }}
          >
            <ArrowLeft size={14} /> Volver a órdenes
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[orden.status] ?? statusConfig["REGISTRADA"]
  const canAssign = orden.status === "REGISTRADA"

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Back button */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: EASE }} style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => router.push("/agente-logistico/ordenes")}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "#6B6260", background: "none", border: "none",
              cursor: "pointer", transition: "color 0.2s",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#C9924B")}
            onMouseOut={e => (e.currentTarget.style.color = "#6B6260")}
          >
            <ArrowLeft size={14} /> Órdenes
          </button>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "0.5rem" }}>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
              Detalle de Orden
            </p>
            {/* Status badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              background: statusInfo.bg, borderRadius: "3px", padding: "3px 9px",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusInfo.color }} />
              <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: statusInfo.color }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              {orden.orderNumber}
            </motion.h1>
          </div>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Content grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>

          {/* Info de la Orden */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", overflow: "hidden",
            }}>
            <div style={{ height: "2px", background: "#C9924B" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                Información de la Orden
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <DetailField icon={<Package size={14} />} label="Número de Orden" value={orden.orderNumber} />
                <DetailField
                  icon={<Calendar size={14} />}
                  label="Fecha de Solicitud"
                  value={new Date(orden.requestedAt).toLocaleDateString("es-GT", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                />
                <DetailField icon={<MapPin size={14} />} label="Origen" value={orden.origin} />
                <DetailField icon={<MapPin size={14} />} label="Destino" value={orden.destination} />
                <DetailField icon={<Weight size={14} />} label="Peso Declarado" value={`${orden.declaredWeightTon} toneladas`} />
                <DetailField icon={<Package size={14} />} label="Tipo de Carga" value={orden.cargoType} />
                {orden.requiresRefrigeration && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#6B6260", fontWeight: 600 }}>
                    <span>❄</span> Requiere refrigeración
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Info del Cliente */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", overflow: "hidden",
            }}>
            <div style={{ height: "2px", background: "rgba(12,12,10,0.1)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                Información del Cliente
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <DetailField icon={<User size={14} />} label="Nombre" value={orden.clientName} />
                <DetailField icon={<Phone size={14} />} label="Teléfono" value={orden.clientPhone} />
                <DetailField icon={<Mail size={14} />} label="Email" value={orden.clientEmail} />
                <DetailField icon={<Home size={14} />} label="Dirección" value={orden.clientAddress} />
              </div>
            </div>
          </motion.div>

          {/* Rutas del Contrato */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.46, duration: 0.6, ease: EASE }}
            style={{
              background: "#1E1E1B", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px", overflow: "hidden",
            }}>
            <div style={{ height: "2px", background: "rgba(201,146,75,0.4)" }} />
            <div style={{ padding: "1.5rem 1.75rem" }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                Rutas del Contrato
              </p>
              {orden.contractRoutes.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "#6B6260" }}>No hay rutas configuradas en este contrato.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {orden.contractRoutes.map((cr) => (
                    <div key={cr.contractRouteId} style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "4px", padding: "0.75rem 1rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                        <MapPin size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", color: "#F5F2EC", fontWeight: 600 }}>
                          {cr.origin}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "#6B6260" }}>→</span>
                        <span style={{ fontSize: "0.78rem", color: "#F5F2EC", fontWeight: 600 }}>
                          {cr.destination}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", paddingLeft: "18px" }}>
                        <Clock size={10} style={{ color: "#6B6260" }} />
                        <span style={{ fontSize: "0.68rem", color: "#6B6260" }}>{cr.estimatedHours}h estimadas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Asignación actual */}
          {orden.assignedUnit && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.6, ease: EASE }}
              style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", overflow: "hidden",
              }}>
              <div style={{ height: "2px", background: "#3A8E2A" }} />
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                  Asignación Actual
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <DetailField icon={<Truck size={14} />} label="Placa" value={orden.assignedUnit.plate} />
                  <DetailField icon={<Package size={14} />} label="Tipo de Vehículo" value={orden.assignedUnit.vehicleType} />
                  <DetailField icon={<User size={14} />} label="Piloto" value={orden.assignedUnit.pilotName} />
                  {orden.scheduledPickupAt && (
                    <DetailField
                      icon={<Calendar size={14} />}
                      label="Salida Programada"
                      value={new Date(orden.scheduledPickupAt).toLocaleString("es-GT")}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* CTA — Asignar */}
        {canAssign && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6, ease: EASE }}
            style={{ marginTop: "2rem", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "0.85rem 2.5rem",
                background: "#0C0C0A", border: "1px solid #0C0C0A", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "#F5F2EC", cursor: "pointer",
                transition: "background 0.2s, border-color 0.2s, color 0.2s",
              }}
              onMouseOver={e => {
                const el = e.currentTarget
                el.style.background = "#C9924B"
                el.style.borderColor = "#C9924B"
              }}
              onMouseOut={e => {
                const el = e.currentTarget
                el.style.background = "#0C0C0A"
                el.style.borderColor = "#0C0C0A"
              }}
            >
              <Truck size={15} />
              Asignar piloto y vehículo
            </button>
          </motion.div>
        )}

      </div>

      {/* Modal */}
      {showModal && orden && (
        <ModalAsignacion
          orden={orden}
          onClose={() => setShowModal(false)}
          onSuccess={() => router.push("/agente-logistico/ordenes")}
        />
      )}
    </div>
  )
}
