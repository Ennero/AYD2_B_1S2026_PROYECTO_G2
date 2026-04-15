"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Package, Search, X, ChevronLeft, ChevronRight,
  MapPin, Truck, Calendar, Clock, CheckCircle2, Circle,
  AlertCircle, Navigation, Flag, ShieldAlert, RotateCcw,
  Plus, Weight, DollarSign,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

type OrderStatus =
  | "REGISTRADA" | "ASIGNADA" | "LISTA_PARA_DESPACHO"
  | "EN_TRANSITO" | "ENTREGADA" | "BLOQUEADA" | "CANCELADA"

type EventType = "SALIDA" | "PUNTO_CONTROL" | "ADUANA" | "INCIDENTE" | "LLEGADA" | "OTRO"

interface OrderSummary {
  orderId: string
  orderNumber: string
  status: OrderStatus
  cargoType: string | null
  pickupAddress: string
  deliveryAddress: string
  origin: string | null
  destination: string | null
  declaredWeightTon: number
  currencyCode: "GTQ" | "USD" | "HNL"
  totalAmount: number
  requestedAt: string
  scheduledPickupAt: string | null
  promisedDeliveryAt: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  unitPlate: string | null
  vehicleType: string | null
}

interface TrackingLog {
  logId: string
  eventType: EventType
  eventTime: string
  description: string
  imagePath?: string | null
}

interface OrderTracking extends OrderSummary {
  cargoDescription: string
  loadedWeightTon: number | null
  receiverName: string | null
  receiverSignaturePath: string | null
  deliveryEvidencePaths: string[]
  stowageConfirmed: boolean | null
  isSealed: boolean | null
  logs: TrackingLog[]
}

interface OrderPage {
  items: OrderSummary[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/* ─── Status / Event configs ─────────────────────────────────────────────── */

const STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string; borderColor: string }> = {
  REGISTRADA:          { label: "Registrada",        color: "#6B6260", bg: "rgba(107,98,96,0.07)",   borderColor: "#9A9489" },
  ASIGNADA:            { label: "Asignada",           color: "#2563EB", bg: "rgba(37,99,235,0.08)",   borderColor: "#3B82F6" },
  LISTA_PARA_DESPACHO: { label: "Lista p/ despacho", color: "#7C3AED", bg: "rgba(124,58,237,0.08)",  borderColor: "#8B5CF6" },
  EN_TRANSITO:         { label: "En tránsito",        color: "#C9924B", bg: "rgba(201,146,75,0.10)",  borderColor: "#C9924B" },
  ENTREGADA:           { label: "Entregada",          color: "#3A8E2A", bg: "rgba(58,142,42,0.08)",   borderColor: "#3A8E2A" },
  BLOQUEADA:           { label: "Bloqueada",          color: "#E53E3E", bg: "rgba(229,62,62,0.08)",   borderColor: "#E53E3E" },
  CANCELADA:           { label: "Cancelada",          color: "#9A9489", bg: "rgba(154,148,137,0.05)", borderColor: "rgba(12,12,10,0.12)" },
}

const EVENT_CFG: Record<EventType, { label: string; Icon: React.ElementType; color: string }> = {
  SALIDA:        { label: "Salida",           Icon: Navigation, color: "#C9924B" },
  PUNTO_CONTROL: { label: "Punto de control", Icon: Circle,     color: "#3B82F6" },
  ADUANA:        { label: "Aduana",           Icon: ShieldAlert, color: "#8B5CF6" },
  INCIDENTE:     { label: "Incidente",        Icon: AlertCircle, color: "#E53E3E" },
  LLEGADA:       { label: "Llegada",          Icon: Flag,       color: "#3A8E2A" },
  OTRO:          { label: "Otro",             Icon: Clock,      color: "#9A9489" },
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function fmtDate(d: string | null | undefined, withTime = false) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("es-GT", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function fmtCurrency(n: number, currencyCode: "GTQ" | "USD" | "HNL") {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(n)
}

/* ─── Tracking Drawer ───────────────────────────────────────────────────── */

function TrackingDrawer({ orderId, open, onClose }: { orderId: string | null; open: boolean; onClose: () => void }) {
  const [data, setData] = useState<OrderTracking | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewMedia, setPreviewMedia] = useState<string | null>(null)

  const fetchTracking = useCallback(async (silent = false) => {
    if (!open || !orderId) return
    if (!silent) setLoading(true)
    try {
      const res = await api.get<{ data: OrderTracking }>(ENDPOINTS.CLIENT.ORDER_TRACKING(orderId))
      setData(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      if (!silent) setLoading(false)
    }
  }, [open, orderId])

  useEffect(() => {
    if (!open || !orderId) return
    setData(null)
    void fetchTracking()

    const trackingInterval = setInterval(() => {
      void fetchTracking(true)
    }, 8000)

    return () => clearInterval(trackingInterval)
  }, [open, orderId, fetchTracking])

  if (!open) return null

  const isActive = data && !["ENTREGADA", "CANCELADA", "BLOQUEADA"].includes(data.status)
  const statusCfg = data ? STATUS_CFG[data.status] : null

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(12,12,10,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100%", width: "100%", maxWidth: "480px",
        zIndex: 50, display: "flex", flexDirection: "column",
        background: "#F5F2EC", borderLeft: "1px solid rgba(12,12,10,0.1)",
        boxShadow: "-8px 0 32px rgba(12,12,10,0.12)",
      }}>
        <div style={{ height: "3px", background: "#C9924B", flexShrink: 0 }} />
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(12,12,10,0.08)",
          background: "#1E1E1B", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Navigation size={16} style={{ color: "#C9924B" }} />
            <div>
              <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                Tracking de Orden
              </p>
              <p style={{ fontSize: "0.9rem", fontWeight: 900, color: "#F5F2EC", letterSpacing: "-0.02em" }}>
                {loading ? "Cargando…" : (data?.orderNumber ?? "—")}
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
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: "48px", borderRadius: "6px", background: "rgba(12,12,10,0.06)" }} />
              ))}
            </div>
          )}

          {!loading && data && statusCfg && (
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
                {isActive && (
                  <span style={{
                    fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.12em",
                    color: "#C9924B", background: "rgba(201,146,75,0.10)",
                    border: "1px solid rgba(201,146,75,0.3)",
                    padding: "3px 8px", borderRadius: "4px", textTransform: "uppercase",
                  }}>
                    En curso
                  </span>
                )}
              </div>

              {/* Info card */}
              <div style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "0.75rem",
              }}>
                {[
                  { icon: <MapPin size={13} />, label: "Recolección", value: data.pickupAddress },
                  { icon: <MapPin size={13} />, label: "Entrega", value: data.deliveryAddress },
                  ...(data.cargoType ? [{ icon: <Package size={13} />, label: "Mercancía", value: data.cargoType }] : []),
                  { icon: <Weight size={13} />, label: "Peso declarado", value: `${data.declaredWeightTon} ton` },
                  ...(data.loadedWeightTon ? [{ icon: <Weight size={13} />, label: "Peso cargado", value: `${data.loadedWeightTon} ton` }] : []),
                  ...(data.unitPlate ? [{ icon: <Truck size={13} />, label: "Unidad", value: `${data.unitPlate}${data.vehicleType ? ` — ${data.vehicleType}` : ""}` }] : []),
                  ...(data.receiverName ? [{ icon: <CheckCircle2 size={13} />, label: "Recibido por", value: data.receiverName }] : []),
                  { icon: <Calendar size={13} />, label: "Solicitado", value: fmtDate(data.requestedAt, true) },
                  ...(data.scheduledPickupAt ? [{ icon: <Calendar size={13} />, label: "Recolección prog.", value: fmtDate(data.scheduledPickupAt, true) }] : []),
                  ...(data.promisedDeliveryAt ? [{ icon: <Calendar size={13} />, label: "Entrega prometida", value: fmtDate(data.promisedDeliveryAt, true) }] : []),
                  ...(data.deliveredAt ? [{ icon: <CheckCircle2 size={13} />, label: "Entregado", value: fmtDate(data.deliveredAt, true) }] : []),
                  ...(data.totalAmount > 0 ? [{ icon: <DollarSign size={13} />, label: "Total", value: fmtCurrency(data.totalAmount, data.currencyCode) }] : []),
                ].map((row, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.78rem" }}>
                    <span style={{ color: "#9A9489", flexShrink: 0, marginTop: "1px" }}>{row.icon}</span>
                    <span style={{ color: "#9A9489", flexShrink: 0 }}>{row.label}:</span>
                    <span style={{ color: "#0C0C0A", fontWeight: 600 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div>
                <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1rem" }}>
                  Bitácora de ruta
                </p>
                {data.logs.length === 0 ? (
                  <p style={{ fontSize: "0.78rem", color: "#9A9489", textAlign: "center", padding: "2rem 0" }}>
                    Aún no hay eventos registrados.
                  </p>
                ) : (
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "14px", top: 0, bottom: 0,
                      width: "1px", background: "rgba(12,12,10,0.1)",
                    }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {data.logs.map((log, idx) => {
                        const cfg = EVENT_CFG[log.eventType]
                        const isLast = idx === data.logs.length - 1
                        const isIncident = log.eventType === "INCIDENTE"
                        return (
                          <div key={log.logId} style={{ display: "flex", gap: "10px", position: "relative" }}>
                            <div style={{
                              width: "28px", height: "28px", borderRadius: "50%",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "#F5F2EC", flexShrink: 0, zIndex: 1,
                              border: `2px solid ${isIncident ? "#E53E3E" : isLast ? "#C9924B" : "rgba(12,12,10,0.12)"}`,
                            }}>
                              <cfg.Icon size={12} style={{ color: cfg.color }} />
                            </div>
                            <div style={{
                              flex: 1,
                              background: isIncident ? "rgba(229,62,62,0.05)" : isLast ? "rgba(201,146,75,0.05)" : "#ffffff",
                              border: `1px solid ${isIncident ? "rgba(229,62,62,0.2)" : isLast ? "rgba(201,146,75,0.2)" : "rgba(12,12,10,0.07)"}`,
                              borderRadius: "6px", padding: "0.6rem 0.85rem",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                                <span style={{ fontSize: "0.6rem", fontWeight: 700, color: cfg.color, letterSpacing: "0.05em" }}>
                                  {cfg.label}
                                </span>
                                <span style={{ fontSize: "0.52rem", color: "#9A9489" }}>
                                  {fmtDate(log.eventTime, true)}
                                </span>
                              </div>
                              <p style={{ fontSize: "0.72rem", color: "#6B6260" }}>{log.description}</p>

                              {log.imagePath && (
                                <button
                                  onClick={() => setPreviewMedia(log.imagePath ?? null)}
                                  style={{
                                    marginTop: "0.45rem",
                                    padding: "0.3rem 0.6rem",
                                    borderRadius: "4px",
                                    border: "1px solid rgba(12,12,10,0.18)",
                                    background: "#fff",
                                    fontSize: "0.58rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                  }}
                                >
                                  Ver Imagen
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {(data.receiverSignaturePath || (data.deliveryEvidencePaths?.length ?? 0) > 0) && (
                <div>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.8rem" }}>
                    Evidencia de entrega
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {data.receiverSignaturePath && (
                      <button
                        onClick={() => setPreviewMedia(data.receiverSignaturePath)}
                        style={{
                          padding: "0.35rem 0.7rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(12,12,10,0.18)",
                          background: "#fff",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        Ver Firma
                      </button>
                    )}
                    {(data.deliveryEvidencePaths ?? []).map((path, idx) => (
                      <button
                        key={`${path}-${idx}`}
                        onClick={() => setPreviewMedia(path)}
                        style={{
                          padding: "0.35rem 0.7rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(12,12,10,0.18)",
                          background: "#fff",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          cursor: "pointer",
                        }}
                      >
                        Ver Evidencia {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {previewMedia && (
          <div
            onClick={() => setPreviewMedia(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(12,12,10,0.65)",
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.25rem",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewMedia}
              alt="Evidencia"
              onClick={(event) => event.stopPropagation()}
              style={{
                maxWidth: "min(92vw, 900px)",
                maxHeight: "85vh",
                borderRadius: "8px",
                border: "1px solid rgba(245,242,236,0.2)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                background: "#fff",
              }}
            />
          </div>
        )}
      </div>
    </>
  )
}

/* ─── Order Row ─────────────────────────────────────────────────────────── */

function OrderRow({ order, onTrack }: { order: OrderSummary; onTrack: () => void }) {
  const cfg = STATUS_CFG[order.status]
  const addr = order.destination ?? order.deliveryAddress
  const origin = order.origin ?? order.pickupAddress

  return (
    <div style={{
      background: "#ffffff", borderRadius: "6px", overflow: "hidden",
      border: "1px solid rgba(12,12,10,0.07)", borderLeft: `3px solid ${cfg.borderColor}`,
      display: "flex", alignItems: "center", gap: "1.5rem",
      padding: "1rem 1.25rem", flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: "200px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
          <p style={{ fontSize: "0.9rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A" }}>
            {order.orderNumber}
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
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "#6B6260", marginBottom: "3px" }}>
          <MapPin size={11} style={{ color: "#9A9489", flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }} title={origin}>{origin}</span>
          <span style={{ color: "#9A9489" }}>→</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }} title={addr}>{addr}</span>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "#9A9489" }}>
            <Calendar size={10} />{fmtDate(order.requestedAt)}
          </span>
          {order.declaredWeightTon > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "#9A9489" }}>
              <Weight size={10} />{order.declaredWeightTon} ton
            </span>
          )}
          {order.unitPlate && (
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "#9A9489" }}>
              <Truck size={10} />{order.unitPlate}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onTrack}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "0.5rem 1rem", flexShrink: 0,
          background: "none", border: "1px solid rgba(201,146,75,0.35)",
          borderRadius: "4px", color: "#C9924B",
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseOver={e => { e.currentTarget.style.background = "rgba(201,146,75,0.08)"; e.currentTarget.style.borderColor = "#C9924B" }}
        onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(201,146,75,0.35)" }}
      >
        <Navigation size={12} />
        Ver tracking
      </button>
    </div>
  )
}

/* ─── Filters ────────────────────────────────────────────────────────────── */

const FILTERS: { label: string; value: string }[] = [
  { label: "Todas",             value: "" },
  { label: "Registrada",        value: "REGISTRADA" },
  { label: "Asignada",          value: "ASIGNADA" },
  { label: "Lista p/ despacho", value: "LISTA_PARA_DESPACHO" },
  { label: "En tránsito",       value: "EN_TRANSITO" },
  { label: "Entregada",         value: "ENTREGADA" },
  { label: "Bloqueada",         value: "BLOQUEADA" },
  { label: "Cancelada",         value: "CANCELADA" },
]

const LIMIT = 10

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function OrdenesPage() {
  const [page, setPage] = useState<OrderPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [trackingId, setTrackingId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (s: string, st: string, p: number, options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set("search", s)
      if (st) params.set("status", st)
      params.set("page", String(p))
      params.set("limit", String(LIMIT))
      const res = await api.get<{ data: OrderPage }>(`${ENDPOINTS.CLIENT.ORDERS}?${params.toString()}`)
      setPage(res.data.data)
    } catch {
      // api client shows toast
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setCurrentPage(1)
      void fetchOrders(search, statusFilter, 1)
    }, 350)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [search, statusFilter, fetchOrders])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchOrders(search, statusFilter, currentPage) }, [currentPage])

  useEffect(() => {
    const ordersPolling = setInterval(() => {
      void fetchOrders(search, statusFilter, currentPage, { silent: true })
    }, 12000)

    return () => clearInterval(ordersPolling)
  }, [fetchOrders, search, statusFilter, currentPage])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    void fetchOrders(search, statusFilter, currentPage, { silent: true })
  }, [fetchOrders, search, statusFilter, currentPage])

  const orders = page?.items ?? []
  const totalPages = page?.totalPages ?? 1

  return (
    <>
      <TrackingDrawer orderId={trackingId} open={drawerOpen} onClose={handleCloseDrawer} />

      <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
        <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
          backgroundSize: "72px 72px",
        }} />
        <div aria-hidden style={{
          position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
          fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
          color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}>OR</div>

        <div className="relative z-10 max-w-4xl mx-auto px-8 py-14">

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
                Historial de Órdenes
              </motion.h1>
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
              Consulta el estado y tracking de todos tus envíos.
            </motion.p>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
              style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
          </motion.div>

          {/* Toolbar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => void fetchOrders(search, statusFilter, currentPage)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "0.5rem 0.9rem", background: "none",
                border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6B6260", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
            >
              <RotateCcw size={12} />
              Actualizar
            </button>
            <Link href="/cliente/nuevo-servicio" style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "0.55rem 1.1rem", background: "#C9924B", border: "none",
              borderRadius: "4px", fontSize: "0.62rem", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase", color: "#ffffff", textDecoration: "none",
            }}>
              <Plus size={12} />
              Nueva Orden
            </Link>
          </motion.div>

          {/* Filter card */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease: EASE }}
            style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "1.25rem", marginBottom: "1rem",
            }}>
            <div style={{ position: "relative", marginBottom: "1rem" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9A9489", pointerEvents: "none" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número de orden..."
                style={{
                  width: "100%", boxSizing: "border-box",
                  paddingLeft: "36px", paddingRight: "1rem", paddingTop: "0.55rem", paddingBottom: "0.55rem",
                  background: "#F5F2EC", border: "1px solid rgba(12,12,10,0.12)",
                  borderRadius: "4px", color: "#0C0C0A", fontSize: "0.85rem", outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#C9924B")}
                onBlur={e => (e.target.style.borderColor = "rgba(12,12,10,0.12)")}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setCurrentPage(1) }}
                  style={{
                    padding: "4px 12px", borderRadius: "4px",
                    fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s",
                    background: statusFilter === f.value ? "#C9924B" : "rgba(12,12,10,0.05)",
                    color: statusFilter === f.value ? "#ffffff" : "#6B6260",
                    border: statusFilter === f.value ? "1px solid #C9924B" : "1px solid rgba(12,12,10,0.08)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {page && (
              <p style={{ fontSize: "0.62rem", color: "#9A9489", marginTop: "0.75rem" }}>
                {page.total} orden{page.total !== 1 ? "es" : ""} encontrada{page.total !== 1 ? "s" : ""}
              </p>
            )}
          </motion.div>

          {/* List */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ height: "80px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div style={{
              background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "4rem 2rem", textAlign: "center",
            }}>
              <Package size={32} style={{ color: "#9A9489", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0C0C0A", marginBottom: "4px" }}>
                {search || statusFilter ? "Sin resultados" : "No tienes órdenes aún"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9A9489" }}>
                {search || statusFilter ? "Prueba con otro filtro." : "Solicita tu primer servicio de transporte."}
              </p>
              {!search && !statusFilter && (
                <Link href="/cliente/nuevo-servicio" style={{
                  display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "1rem",
                  padding: "0.55rem 1.1rem", background: "#C9924B", borderRadius: "4px",
                  fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "#ffffff", textDecoration: "none",
                }}>
                  <Plus size={12} />
                  Solicitar servicio
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {orders.map((order, i) => (
                <motion.div key={order.orderId}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.05, duration: 0.5, ease: EASE }}>
                  <OrderRow order={order} onTrack={() => { setTrackingId(order.orderId); setDrawerOpen(true) }} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem" }}>
              <p style={{ fontSize: "0.62rem", color: "#9A9489" }}>
                Página {currentPage} de {totalPages}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    width: "32px", height: "32px", borderRadius: "4px", display: "flex",
                    alignItems: "center", justifyContent: "center", background: "none",
                    border: "1px solid rgba(12,12,10,0.12)",
                    color: currentPage === 1 ? "rgba(12,12,10,0.2)" : "#6B6260",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "4px",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
                        background: p === currentPage ? "#C9924B" : "none",
                        color: p === currentPage ? "#ffffff" : "#6B6260",
                        border: p === currentPage ? "1px solid #C9924B" : "1px solid rgba(12,12,10,0.12)",
                      }}
                    >
                      {p}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    width: "32px", height: "32px", borderRadius: "4px", display: "flex",
                    alignItems: "center", justifyContent: "center", background: "none",
                    border: "1px solid rgba(12,12,10,0.12)",
                    color: currentPage === totalPages ? "rgba(12,12,10,0.2)" : "#6B6260",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
