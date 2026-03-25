"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  FileText, Search, ChevronRight, X, CheckCircle2, XCircle,
  Calendar, CreditCard, Clock, MapPin, Truck, Package,
  Thermometer, AlertCircle, RotateCcw, Tag,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ContractStatus = "BORRADOR" | "PENDIENTE" | "VIGENTE" | "VENCIDO" | "RECHAZADO" | "CANCELADO"

interface ContractSummary {
  contractId: string
  contractNumber: string
  status: ContractStatus
  startDate: string
  endDate: string
  acceptedAt: string | null
  creditLimit: number
  paymentTermDays: number
  discountPercentage: number
  notes: string | null
}

interface ContractRoute {
  contractRouteId: string
  promisedDeliveryHours: number
  route: {
    routeCode: string
    origin: string
    destination: string
    distanceKm: number
    isInternational: boolean
  }
}

interface ContractRate {
  contractRateId: string
  baseRatePerKm: number
  discountPercentage: number
  finalRatePerKm: number
  vehicleType: {
    typeCode: string
    typeName: string
    minCapacityTon: number
    maxCapacityTon: number | null
  }
}

interface ContractDetail extends ContractSummary {
  cargoTypes: { cargoTypeId: number; cargoName: string; requiresRefrigeration: boolean }[]
  routes: ContractRoute[]
  rates: ContractRate[]
}

/* ─── Status config ─────────────────────────────────────────────────────── */

const STATUS_CFG: Record<ContractStatus, { label: string; color: string; bg: string; borderColor: string }> = {
  BORRADOR:  { label: "Borrador",  color: "#6B6260", bg: "rgba(107,98,96,0.07)",  borderColor: "rgba(12,12,10,0.12)" },
  PENDIENTE: { label: "Pendiente", color: "#C9924B", bg: "rgba(201,146,75,0.10)", borderColor: "#C9924B" },
  VIGENTE:   { label: "Vigente",   color: "#3A8E2A", bg: "rgba(58,142,42,0.08)",  borderColor: "#3A8E2A" },
  VENCIDO:   { label: "Vencido",   color: "#E53E3E", bg: "rgba(229,62,62,0.08)",  borderColor: "#E53E3E" },
  RECHAZADO: { label: "Rechazado", color: "#E53E3E", bg: "rgba(229,62,62,0.05)",  borderColor: "rgba(229,62,62,0.3)" },
  CANCELADO: { label: "Cancelado", color: "#9A9489", bg: "rgba(154,148,137,0.05)", borderColor: "rgba(12,12,10,0.08)" },
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtCurrency(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2 })}`
}

/* ─── Contract Drawer ───────────────────────────────────────────────────── */

function ContractDrawer({
  contractId, open, onClose, onStatusChange,
}: {
  contractId: string | null
  open: boolean
  onClose: () => void
  onStatusChange: (contractId: string, newStatus: ContractStatus) => void
}) {
  const [detail, setDetail] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<"accept" | "reject" | null>(null)

  useEffect(() => {
    if (!open || !contractId) return
    setDetail(null)
    setLoading(true)
    void api
      .get<{ data: ContractDetail }>(ENDPOINTS.CLIENT.CONTRACT_DETAIL(contractId))
      .then((res) => setDetail(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, contractId])

  const handleAccept = async () => {
    if (!contractId) return
    setActing("accept")
    try {
      await api.patch(ENDPOINTS.CLIENT.CONTRACT_ACCEPT(contractId))
      toast.success("Contrato aceptado. Ya está vigente.")
      onStatusChange(contractId, "VIGENTE")
      if (detail) setDetail({ ...detail, status: "VIGENTE" })
    } catch { /* api client shows toast */ } finally { setActing(null) }
  }

  const handleReject = async () => {
    if (!contractId) return
    setActing("reject")
    try {
      await api.patch(ENDPOINTS.CLIENT.CONTRACT_REJECT(contractId))
      toast.success("Propuesta rechazada.")
      onStatusChange(contractId, "RECHAZADO")
      if (detail) setDetail({ ...detail, status: "RECHAZADO" })
    } catch { /* api client shows toast */ } finally { setActing(null) }
  }

  if (!open) return null

  const statusCfg = detail ? STATUS_CFG[detail.status] : null

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(12,12,10,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100%", width: "100%", maxWidth: "520px",
        zIndex: 50, display: "flex", flexDirection: "column",
        background: "#F5F2EC", borderLeft: "1px solid rgba(12,12,10,0.1)",
        boxShadow: "-8px 0 32px rgba(12,12,10,0.12)",
      }}>
        <div style={{ height: "3px", background: "#C9924B", flexShrink: 0 }} />
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", background: "#1E1E1B",
          borderBottom: "1px solid rgba(12,12,10,0.08)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={16} style={{ color: "#C9924B" }} />
            <div>
              <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                Detalle del Contrato
              </p>
              <p style={{ fontSize: "0.9rem", fontWeight: 900, color: "#F5F2EC", letterSpacing: "-0.02em" }}>
                {loading ? "Cargando…" : (detail?.contractNumber ?? "—")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "4px", display: "flex",
              alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", color: "#9A9489", cursor: "pointer",
            }}
            onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ height: "40px", borderRadius: "6px", background: "rgba(12,12,10,0.06)" }} />
              ))}
            </div>
          )}

          {!loading && detail && statusCfg && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Status row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "4px 10px", borderRadius: "4px",
                  background: statusCfg.bg, color: statusCfg.color,
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusCfg.color, flexShrink: 0 }} />
                  {statusCfg.label}
                </span>
                {detail.acceptedAt && (
                  <p style={{ fontSize: "0.62rem", color: "#9A9489" }}>
                    Aceptado: {new Date(detail.acceptedAt).toLocaleDateString("es-GT")}
                  </p>
                )}
              </div>

              {/* Condiciones generales */}
              <div>
                <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                  Condiciones Generales
                </p>
                <div style={{
                  background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                  borderRadius: "6px", padding: "1rem",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
                }}>
                  {[
                    { label: "Número", value: detail.contractNumber },
                    { label: "Inicio", value: fmtDate(detail.startDate) },
                    { label: "Vencimiento", value: fmtDate(detail.endDate) },
                    { label: "Límite de Crédito", value: fmtCurrency(detail.creditLimit) },
                    { label: "Plazo de Pago", value: `${detail.paymentTermDays} días` },
                    ...(detail.discountPercentage > 0 ? [{ label: "Descuento Base", value: `${detail.discountPercentage}%` }] : []),
                  ].map((f) => (
                    <div key={f.label}>
                      <p style={{ fontSize: "0.52rem", color: "#9A9489", marginBottom: "2px", letterSpacing: "0.05em" }}>{f.label}</p>
                      <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {detail.notes && (
                <div style={{
                  display: "flex", gap: "10px", alignItems: "flex-start",
                  background: "rgba(201,146,75,0.06)", border: "1px solid rgba(201,146,75,0.2)",
                  borderRadius: "6px", padding: "0.85rem",
                }}>
                  <AlertCircle size={14} style={{ color: "#C9924B", flexShrink: 0, marginTop: "1px" }} />
                  <p style={{ fontSize: "0.75rem", color: "#6B6260" }}>{detail.notes}</p>
                </div>
              )}

              {/* Tipos de carga */}
              {detail.cargoTypes.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Tipos de Mercancía Autorizados
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {detail.cargoTypes.map((ct) => (
                      <span key={ct.cargoTypeId} style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 10px", borderRadius: "4px",
                        background: "rgba(12,12,10,0.04)", border: "1px solid rgba(12,12,10,0.08)",
                        fontSize: "0.72rem", color: "#6B6260", fontWeight: 600,
                      }}>
                        {ct.requiresRefrigeration && <Thermometer size={11} style={{ color: "#3B82F6" }} />}
                        <Package size={11} style={{ color: "#9A9489" }} />
                        {ct.cargoName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rutas */}
              {detail.routes.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Rutas Contratadas
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detail.routes.map((cr) => (
                      <div key={cr.contractRouteId} style={{
                        background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                        borderRadius: "6px", padding: "0.85rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <MapPin size={13} style={{ color: "#C9924B", flexShrink: 0, marginTop: "1px" }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {cr.route.origin} <span style={{ color: "#9A9489" }}>→</span> {cr.route.destination}
                            </p>
                            <div style={{ display: "flex", gap: "12px", marginTop: "4px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "0.65rem", color: "#9A9489" }}>{cr.route.distanceKm} km</span>
                              <span style={{ fontSize: "0.65rem", color: "#9A9489" }}>Entrega: {cr.promisedDeliveryHours}h</span>
                              {cr.route.isInternational && (
                                <span style={{
                                  fontSize: "0.6rem", fontWeight: 700, color: "#8B5CF6",
                                  background: "rgba(139,92,246,0.08)", padding: "1px 6px", borderRadius: "3px",
                                }}>Internacional</span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: "0.6rem", color: "#9A9489", flexShrink: 0 }}>{cr.route.routeCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarifas */}
              {detail.rates.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.75rem" }}>
                    Tarifario por Tipo de Unidad
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {detail.rates.map((r) => (
                      <div key={r.contractRateId} style={{
                        background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                        borderRadius: "6px", padding: "0.85rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
                          <Truck size={13} style={{ color: "#C9924B" }} />
                          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0C0C0A" }}>{r.vehicleType.typeName}</p>
                          <span style={{ fontSize: "0.62rem", color: "#9A9489" }}>
                            ({r.vehicleType.minCapacityTon}{r.vehicleType.maxCapacityTon ? `–${r.vehicleType.maxCapacityTon}` : "+"}t)
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                          <div style={{ background: "#F5F2EC", borderRadius: "4px", padding: "0.5rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.48rem", color: "#9A9489", marginBottom: "2px" }}>Tarifa base</p>
                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B6260" }}>Q{r.baseRatePerKm}/km</p>
                          </div>
                          {r.discountPercentage > 0 && (
                            <div style={{ background: "rgba(58,142,42,0.06)", borderRadius: "4px", padding: "0.5rem", textAlign: "center" }}>
                              <p style={{ fontSize: "0.48rem", color: "#9A9489", marginBottom: "2px" }}>Descuento</p>
                              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#3A8E2A" }}>{r.discountPercentage}%</p>
                            </div>
                          )}
                          <div style={{ background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)", borderRadius: "4px", padding: "0.5rem", textAlign: "center" }}>
                            <p style={{ fontSize: "0.48rem", color: "#C9924B", marginBottom: "2px" }}>Tarifa final</p>
                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#C9924B" }}>Q{r.finalRatePerKm}/km</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — acciones PENDIENTE */}
        {detail?.status === "PENDIENTE" && (
          <div style={{
            flexShrink: 0, padding: "1rem 1.5rem",
            borderTop: "1px solid rgba(12,12,10,0.08)", background: "#1E1E1B",
          }}>
            <p style={{ fontSize: "0.65rem", color: "#9A9489", marginBottom: "0.75rem" }}>
              Este contrato está pendiente de tu aprobación.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => void handleAccept()}
                disabled={acting !== null}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "0.65rem 1rem", borderRadius: "4px",
                  background: acting === "accept" ? "rgba(58,142,42,0.5)" : "#3A8E2A",
                  border: "none", color: "#ffffff",
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: acting !== null ? "not-allowed" : "pointer",
                  opacity: acting !== null && acting !== "accept" ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseOver={e => { if (!acting) e.currentTarget.style.background = "#2d7222" }}
                onMouseOut={e => { if (!acting) e.currentTarget.style.background = "#3A8E2A" }}
              >
                <CheckCircle2 size={14} />
                {acting === "accept" ? "Aceptando…" : "Aceptar Contrato"}
              </button>
              <button
                onClick={() => void handleReject()}
                disabled={acting !== null}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  padding: "0.65rem 1rem", borderRadius: "4px",
                  background: "none", border: "1px solid rgba(229,62,62,0.5)", color: "#E53E3E",
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", cursor: acting !== null ? "not-allowed" : "pointer",
                  opacity: acting !== null && acting !== "reject" ? 0.5 : 1,
                  transition: "background 0.2s",
                }}
                onMouseOver={e => { if (!acting) e.currentTarget.style.background = "rgba(229,62,62,0.08)" }}
                onMouseOut={e => { if (!acting) e.currentTarget.style.background = "none" }}
              >
                <XCircle size={14} />
                {acting === "reject" ? "Rechazando…" : "Rechazar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Contract Card ─────────────────────────────────────────────────────── */

function ContractCard({ contract, onOpen }: { contract: ContractSummary; onOpen: () => void }) {
  const cfg = STATUS_CFG[contract.status]
  const isExpiringSoon =
    contract.status === "VIGENTE" &&
    (() => {
      const end = new Date(contract.endDate + "T00:00:00")
      const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    })()

  return (
    <div style={{
      background: "#ffffff", border: `1px solid ${cfg.borderColor}`,
      borderRadius: "6px", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 0,
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "0 4px 20px rgba(12,12,10,0.08)"; el.style.transform = "translateY(-2px)" }}
      onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = "none"; el.style.transform = "translateY(0)" }}
    >
      <div style={{ height: "3px", background: cfg.color }} />
      <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Top */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <p style={{ fontSize: "0.9rem", fontWeight: 900, color: "#0C0C0A", letterSpacing: "-0.02em", marginBottom: "4px" }}>
              {contract.contractNumber}
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "2px 8px", borderRadius: "4px",
              background: cfg.bg, color: cfg.color,
              fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
              {cfg.label}
            </span>
          </div>
          {contract.status === "PENDIENTE" && (
            <span style={{
              fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.1em",
              color: "#C9924B", background: "rgba(201,146,75,0.10)",
              border: "1px solid rgba(201,146,75,0.3)",
              padding: "3px 7px", borderRadius: "3px", textTransform: "uppercase", flexShrink: 0,
            }}>
              Requiere acción
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {[
            { icon: <Calendar size={11} />, text: `Inicio: ${fmtDate(contract.startDate)}`, warn: false },
            { icon: <Calendar size={11} />, text: `Vence: ${fmtDate(contract.endDate)}`, warn: isExpiringSoon },
            { icon: <CreditCard size={11} />, text: `Crédito: ${fmtCurrency(contract.creditLimit)}`, warn: false },
            { icon: <Clock size={11} />, text: `Plazo: ${contract.paymentTermDays}d`, warn: false },
            ...(contract.discountPercentage > 0 ? [{ icon: <Tag size={11} />, text: `Descuento: ${contract.discountPercentage}%`, warn: false, green: true }] : []),
          ].map((item, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.68rem" }}>
              <span style={{ color: item.warn ? "#C9924B" : "#9A9489" }}>{item.icon}</span>
              <span style={{ color: item.warn ? "#C9924B" : "#6B6260", fontWeight: item.warn ? 600 : 400 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {isExpiringSoon && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(201,146,75,0.06)", border: "1px solid rgba(201,146,75,0.2)",
            borderRadius: "4px", padding: "0.5rem 0.75rem",
          }}>
            <AlertCircle size={12} style={{ color: "#C9924B", flexShrink: 0 }} />
            <p style={{ fontSize: "0.65rem", color: "#C9924B" }}>Contrato próximo a vencer</p>
          </div>
        )}

        <button
          onClick={onOpen}
          style={{
            marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            padding: "0.55rem 1rem", background: "none",
            border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "#6B6260", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(201,146,75,0.4)"; e.currentTarget.style.color = "#C9924B" }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)"; e.currentTarget.style.color = "#6B6260" }}
        >
          Ver Detalles
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

/* ─── Status filters ─────────────────────────────────────────────────────── */

const STATUS_FILTERS: { label: string; value: ContractStatus | "TODOS" }[] = [
  { label: "Todos",     value: "TODOS" },
  { label: "Vigente",   value: "VIGENTE" },
  { label: "Pendiente", value: "PENDIENTE" },
  { label: "Vencido",   value: "VENCIDO" },
  { label: "Rechazado", value: "RECHAZADO" },
]

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function ContratosPage() {
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "TODOS">("TODOS")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: ContractSummary[] }>(ENDPOINTS.CLIENT.CONTRACTS)
      setContracts(res.data.data)
    } catch { /* api client shows toast */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { void fetchContracts() }, [fetchContracts])

  const handleStatusChange = (contractId: string, newStatus: ContractStatus) => {
    setContracts((prev) => prev.map((c) => (c.contractId === contractId ? { ...c, status: newStatus } : c)))
  }

  const filtered = contracts.filter((c) => {
    const matchesSearch = c.contractNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "TODOS" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = contracts.filter((c) => c.status === "PENDIENTE").length

  return (
    <>
      <ContractDrawer
        contractId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />

      <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
        <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
          backgroundSize: "72px 72px",
        }} />
        <div aria-hidden style={{
          position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
          fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
          color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}>CR</div>

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
                Reglas y Contratos
              </motion.h1>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
              Consulta los contratos y condiciones operativas pactadas con LogiTrans.
            </motion.p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
              style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
          </motion.div>

          {/* Pending banner */}
          {!loading && pendingCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE }}
              style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                background: "rgba(201,146,75,0.06)", border: "1px solid rgba(201,146,75,0.3)",
                borderRadius: "6px", padding: "1rem 1.25rem", marginBottom: "1rem",
              }}>
              <AlertCircle size={16} style={{ color: "#C9924B", flexShrink: 0, marginTop: "1px" }} />
              <div>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#C9924B", marginBottom: "2px" }}>
                  {pendingCount === 1
                    ? "Tienes 1 contrato pendiente de aprobación"
                    : `Tienes ${pendingCount} contratos pendientes de aprobación`}
                </p>
                <p style={{ fontSize: "0.72rem", color: "#6B6260" }}>
                  Revisa los detalles y acepta o rechaza la propuesta para activar el servicio.
                </p>
              </div>
            </motion.div>
          )}

          {/* Filter bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "1rem 1.25rem", marginBottom: "1.5rem",
              display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center",
            }}>
            <div style={{ position: "relative", flex: 1, minWidth: "200px", maxWidth: "300px" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contrato..."
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
              {STATUS_FILTERS.map((f) => {
                const count = f.value === "TODOS" ? contracts.length : contracts.filter((c) => c.status === f.value).length
                if (f.value !== "TODOS" && count === 0) return null
                const active = statusFilter === f.value
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "4px 10px", borderRadius: "4px",
                      fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
                      background: active ? "#C9924B" : "rgba(12,12,10,0.05)",
                      color: active ? "#ffffff" : "#6B6260",
                      border: active ? "1px solid #C9924B" : "1px solid rgba(12,12,10,0.08)",
                    }}
                  >
                    {f.label}
                    <span style={{
                      fontSize: "0.55rem", padding: "0 4px", borderRadius: "3px",
                      background: active ? "rgba(255,255,255,0.2)" : "rgba(12,12,10,0.08)",
                    }}>{count}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => void fetchContracts()}
              style={{
                display: "flex", alignItems: "center", gap: "5px",
                padding: "0.5rem 0.75rem", background: "none",
                border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6B6260", cursor: "pointer",
                transition: "border-color 0.15s", marginLeft: "auto",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
            >
              <RotateCcw size={12} />
            </button>
          </motion.div>

          {/* Loading skeletons */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ height: "200px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "4rem 2rem", textAlign: "center",
            }}>
              <FileText size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "4px" }}>
                {search || statusFilter !== "TODOS" ? "Sin resultados" : "No hay contratos"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9A9489" }}>
                {search || statusFilter !== "TODOS"
                  ? "Prueba con otro filtro."
                  : "Aún no tienes contratos. Contacta a tu agente operativo."}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}
            >
              {filtered.map((c) => (
                <ContractCard
                  key={c.contractId}
                  contract={c}
                  onOpen={() => { setSelectedId(c.contractId); setDrawerOpen(true) }}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
